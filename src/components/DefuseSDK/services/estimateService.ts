import { http, type Address, type Hash, createPublicClient } from "viem"

// Function returns the gas cost in Wei for a transfer
export async function estimateEVMTransferCost({
  rpcUrl,
  from,
  to,
  data,
  value,
}: {
  rpcUrl: string
  from: Address
  to: Address
  data?: Hash
  value?: bigint
}): Promise<bigint> {
  const client = createPublicClient({
    transport: http(rpcUrl),
  })
  const gasLimit = await client.estimateGas({
    account: from,
    to,
    data: data ?? "0x",
    value: value ?? 0n,
  })
  const gasPrice = await client.getGasPrice()
  // Add 15% buffer to gas cost estimation to account for potential price fluctuations
  const costInWei = (gasPrice * gasLimit * 115n) / 100n
  return costInWei
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
  const BASE_RESERVE_XLM = 0.5
  const SAFETY_MARGIN_XLM = 0.001
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
  const minBalanceXLM = (2 + subentries) * BASE_RESERVE_XLM + SAFETY_MARGIN_XLM
  const minBalanceStroops = BigInt(Math.ceil(minBalanceXLM * 1e7)) // 1 XLM = 10^7 stroops

  // Calculate transaction fee for a single XLM transfer with buffer
  const baseFeeStroops = BigInt(feeData.fee_charged?.p10 ?? 100) // p10 fee or defaults to 100 stroops if unavailable
  const bufferedFeePerOp =
    (baseFeeStroops * FEE_BUFFER_PERCENT) / FEE_BASE_PERCENT
  const transactionFeeStroops = bufferedFeePerOp * 1n

  const totalCost = minBalanceStroops + transactionFeeStroops
  return totalCost
}
