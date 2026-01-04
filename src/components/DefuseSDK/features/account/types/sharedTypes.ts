import type { TokenInfo, TokenValue } from "../../../types/base"

export interface Holding {
  token: TokenInfo
  value: TokenValue | undefined
  usdValue: number | undefined
  transitValue: TokenValue | undefined
  transitUsdValue: number | undefined
}

export type TransactionType =
  | "send"
  | "receive"
  | "swap"
  | "failed"
  | "processing"
  | "success"

export interface Transaction {
  id: string
  type: TransactionType
  date: string
  token: string
  amount: number
  usdValue: number
  address?: string
  toToken?: string
  toAmount?: number
}
