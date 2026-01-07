export interface TokenAmount {
  token_id: string
  symbol: string
  blockchain: string
  amount: string
  amount_usd: string
}

export interface SwapTransaction {
  id: string
  timestamp: string
  status: "SUCCESS" | "PROCESSING" | "PENDING" | "FAILED"
  from: TokenAmount
  to: TokenAmount
  transaction_hash: string
  deposit_address: string
  slippage?: number
}

export interface SwapHistoryResponse {
  data: SwapTransaction[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface SwapHistoryParams {
  accountId: string
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}

export interface ErrorResponse {
  error: string
}
