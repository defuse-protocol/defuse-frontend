import { http, type Address, type Hash, createPublicClient } from "viem"

// Function returns the gas cost in Wei for a transfer
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
  // Buffers (chain-agnostic)
  const ABSOLUTE_BUFFER_WEI = 50_000_000_000_000n // 0.00005 ETH
  const FLAT_L1_FEE_WEI = 1_000_000_000_000n // 0.000001 ETH everywhere
  const EXTRA_GAS_LIMIT = 1_000n // add ~1k gas headroom
  const PERCENT_MULTIPLIER = 160n // always +60% (no threshold)

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

const PRIORITY_RATE = 20000 // MICRO_LAMPORTS_PER_SOL
// For Solana, the transaction fees are fixed and predictable,
// allowing us to use a constant value instead of estimating gas costs.
export function estimateSolanaTransferCost(): bigint {
  return BigInt(PRIORITY_RATE)
}

// TON gas fees are typically very low and predictable
// Conservative estimates based on TON network characteristics
const TON_NATIVE_TRANSFER_FEE = 50000000n // 0.05 TON for native transfers
const TON_JETTON_TRANSFER_FEE = 100000000n // 0.1 TON for jetton transfers (includes wallet creation if needed)

export function estimateTonTransferCost(isJetton = false): bigint {
  return isJetton ? TON_JETTON_TRANSFER_FEE : TON_NATIVE_TRANSFER_FEE
}

// Stellar gas fees estimation for XLM (Lumens) transfers, including minimum balance buffer
export async function estimateStellarXLMTransferCost({
  rpcUrl,
  userAddress,
}: {
  rpcUrl: string
  userAddress: string
}): Promise<bigint> {
  const BASE_RESERVE_STROOPS = 5000000n // 0.5 XLM in stroops
  const SAFETY_MARGIN_STROOPS = 10000n // 0.001 XLM in stroops
  const FEE_BUFFER_PERCENT = 115n
  const FEE_BASE_PERCENT = 100n

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
