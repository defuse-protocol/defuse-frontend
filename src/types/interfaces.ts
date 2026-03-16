import type { Transaction as TransactionSolana } from "@solana/web3.js"
import type { SendTransactionRequest } from "@tonconnect/ui-react"
import type { SendTransactionParameters } from "viem"

export type JobsDetails = {
  team?: string
  applicationLink?: boolean
  position: string
  link: string
}
export type { SignAndSendTransactionsParams } from "@hot-labs/near-connect/build/types"

export type SendTransactionEVMParams = {
  transactions: Partial<SendTransactionParameters>
}

export type SendTransactionSolanaParams = {
  transactions: TransactionSolana
}

export type Settings = {
  appName: string
  metadata: {
    [key: string]: {
      title: string
      description: string
      openGraph?: {
        type: string
        images: string
        title: string
        description: string
      }
      twitter?: {
        images: string
        title: string
        description: string
      }
    }
  }
}

export type LastLiquidityCheckStatus = "passed" | "failed"

export type PairItem = {
  defuseAssetId: string
  decimals: number
}

export type MaxLiquidity = {
  amount: string
  validated_amount: string
  last_step_size?: string | null
  last_liquidity_check?: LastLiquidityCheckStatus | null
}

export type Pair = {
  in: PairItem
  out: PairItem
  maxLiquidity: MaxLiquidity
}

export type Pairs = Pair[] | null

export type SendTransactionTonParams = {
  transactions: SendTransactionRequest
}
