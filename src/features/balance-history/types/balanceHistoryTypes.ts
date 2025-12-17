export interface BalanceChange {
  block_timestamp: string
  transaction_hash: string
  account_id: string
  token_id: string
  symbol: string
  blockchain: string
  amount: string
  amount_usd: string
  balance_before: string
  balance_after: string
  change_type:
    | "deposit"
    | "withdrawal"
    | "swap_in"
    | "swap_out"
    | "transfer_in"
    | "transfer_out"
}

export interface BalanceHistoryResponse {
  data: BalanceChange[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface BalanceHistoryParams {
  accountId: string
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  tokenId?: string
  changeType?: BalanceChange["change_type"]
}

export interface ErrorResponse {
  error: string
}
