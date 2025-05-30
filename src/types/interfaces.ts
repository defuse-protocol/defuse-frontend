import type { Transaction } from "@near-wallet-selector/core/src/lib/wallet/transactions.types"
import type { Transaction as TransactionSolana } from "@solana/web3.js"
import type { SendTransactionParameters } from "viem"

export type JobsDetails = {
  team?: string
  applicationLink?: boolean
  position: string
  link: string
}

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Copy from @near-wallet-selector/core/src/lib/wallet/wallet.types
export interface SignAndSendTransactionsParams {
  /**
   * NEAR Transactions(s) to sign and send to the network. You can find more information on `Transaction` {@link https://github.com/near/wallet-selector/blob/main/packages/core/docs/api/transactions.md | here}.
   */
  transactions: Array<Optional<Transaction, "signerId">>
}

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

export type Pairs =
  | {
      in: PairItem
      out: PairItem
      maxLiquidity: MaxLiquidity
    }[]
  | null
