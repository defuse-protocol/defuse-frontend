import { TronWeb } from "tronweb"
import { http, type Address, type Hash, createPublicClient } from "viem"

/**
 * EVM gas cost estimation
 */
const ABSOLUTE_BUFFER_WEI = 50_000_000_000_000n // 0.00005 ETH
const FLAT_L1_FEE_WEI = 1_000_000_000_000n // 0.000001 ETH everywhere
const EXTRA_GAS_LIMIT = 1_000n // add ~1k gas headroom
const PERCENT_MULTIPLIER = 160n // always +60% (no threshold)

export async function estimateEVMTransferCost({
  rpcUrl,
  from,
  to,
  data,
}: {
  rpcUrl: string
  from: Address
  to: Address
  data?: Hash
  value?: bigint
}): Promise<bigint> {
  const client = createPublicClient({ transport: http(rpcUrl) })

  // 1) Gas limit (value=0) + small pad
  const rawLimit =
    (await client
      .estimateGas({
        account: from,
        to,
        data: (data ?? "0x") as Hash,
        value: 0n,
      })
      .catch(() => 21_000n)) || 21_000n
  const gasLimit = rawLimit + EXTRA_GAS_LIMIT

  // 2) Price per gas: prefer EIP-1559 caps; fallback to legacy gasPrice
  let pricePerGas: bigint
  try {
    const fees = await client.estimateFeesPerGas()
    pricePerGas =
      fees?.maxFeePerGas ?? fees?.gasPrice ?? (await client.getGasPrice())
  } catch {
    pricePerGas = await client.getGasPrice()
  }

  // 3) Base fee + flat safety
  const l2Fee = gasLimit * pricePerGas
  const baseTotal = l2Fee + FLAT_L1_FEE_WEI

  // 4) Fixed percent buffer (no branch)
  const withPercent = (baseTotal * PERCENT_MULTIPLIER) / 100n

  return withPercent + ABSOLUTE_BUFFER_WEI
}

/**
 * Solana gas cost estimation
 * ~0.00203928 SOL ATA creation + base tx fee + small priority
 */
const BASE_FEE_LAMPORTS = 5000n
const PRIORITY_FEE_LAMPORTS = 1000n
const ATA_CREATION_LAMPORTS = 2_039_280n

export function estimateSolanaTransferCost(): bigint {
  // Covers base transfer and worst case (ATA creation)
  return BASE_FEE_LAMPORTS + PRIORITY_FEE_LAMPORTS + ATA_CREATION_LAMPORTS
}

/**
 * TON gas cost estimation
 */
const TON_NATIVE_TRANSFER_FEE = 50000000n // 0.05 TON for native transfers
const TON_JETTON_TRANSFER_FEE = 100000000n // 0.1 TON for jetton transfers (includes wallet creation if needed)

export function estimateTonTransferCost(isJetton = false): bigint {
  return isJetton ? TON_JETTON_TRANSFER_FEE : TON_NATIVE_TRANSFER_FEE
}

/**
 * Stellar gas cost estimation
 */
const BASE_RESERVE_STROOPS = 5000000n // 0.5 XLM in stroops
const SAFETY_MARGIN_STROOPS = 10000n // 0.001 XLM in stroops
const FEE_BUFFER_PERCENT = 115n
const FEE_BASE_PERCENT = 100n

export async function estimateStellarXLMTransferCost({
  rpcUrl,
  userAddress,
}: {
  rpcUrl: string
  userAddress: string
}): Promise<bigint> {
  const [accountRes, feeRes] = await Promise.all([
    fetch(`${rpcUrl}/accounts/${userAddress}`),
    fetch(`${rpcUrl}/fee_stats`),
  ])

  const account = await accountRes.json()
  const feeData = await feeRes.json()

  // Calculate the minimum required balance for the account based on its subentries
  const subentries: number = account.subentry_count ?? 0
  const minBalanceStroops =
    BigInt(2 + subentries) * BASE_RESERVE_STROOPS + SAFETY_MARGIN_STROOPS

  // Calculate transaction fee for a single XLM transfer with buffer
  const baseFeeStroops = BigInt(feeData.fee_charged?.p10 ?? 100) // p10 fee or defaults to 100 stroops if unavailable
  const bufferedFeePerOp =
    (baseFeeStroops * FEE_BUFFER_PERCENT) / FEE_BASE_PERCENT
  const transactionFeeStroops = bufferedFeePerOp * 1n

  const totalCost = minBalanceStroops + transactionFeeStroops
  return totalCost
}

/**
 * Tron gas cost estimation
 * TRX transfers use Bandwidth (tx size in bytes). Without free/staked Bandwidth, costs 0.001 TRX per bandwidth point. ~600 free Bandwidth/day.
 */
const TRON_ESTIMATION_AMOUNT = 1000000n // 1 TRX in sun for estimation purposes
const TRON_SIGNATURE_BYTES = 65n // one ECDSA signature
const BANDWIDTH_PRICE_SUN = 1000n // Cost per bandwidth point in sun (0.001 TRX = 1000 sun) Reference: https://developers.tron.network/docs/account

export async function estimateTronTransferCost({
  rpcUrl,
  from,
  to,
}: {
  rpcUrl: string
  from: string
  to: string | null
}): Promise<bigint> {
  if (!to) {
    return 0n
  }
  const client = new TronWeb({ fullHost: rpcUrl })

  // 1) Build unsigned tx and measure size
  const tx = await client.transactionBuilder.sendTrx(
    to,
    Number(TRON_ESTIMATION_AMOUNT),
    from
  )
  const rawBytes = BigInt(tx.raw_data_hex.length / 2) // hex → bytes
  const sizeBytes = rawBytes + TRON_SIGNATURE_BYTES

  // 2) 1 byte == 1 bandwidth point
  const bandwidthNeeded = sizeBytes

  // 3) Check available Bandwidth on the sender
  const r = await client.trx.getAccountResources(from)
  const freeLeft = BigInt(
    Math.max(0, (r.freeNetLimit ?? 0) - (r.freeNetUsed ?? 0))
  )
  const stakedLeft = BigInt(Math.max(0, (r.NetLimit ?? 0) - (r.NetUsed ?? 0)))
  const available = freeLeft + stakedLeft

  // 4) Calculate bandwidth deficit and cost
  const deficit = bandwidthNeeded > available ? bandwidthNeeded - available : 0n
  const sunToBurn = deficit * BANDWIDTH_PRICE_SUN

  return sunToBurn
}
