export interface GetSolverLiquidityResponse {
  address_from_to: string
  validated_amount: string
  amount: string
  last_step_size: string | null
  last_liquidity_check: string | null
  created_at: string
  updated_at: string
}
