import { request } from "@defuse-protocol/internal-utils"
import { useQuery } from "@tanstack/react-query"
import { config as globalConfig } from "../config"

export interface GetSolverLiquidityResponse {
  address_from: string
  address_to: string
  validated_amount: string
  amount: string
  last_step_size: string | null
  last_liquidity_check: string | null
  created_at: string
  updated_at: string
}

export async function getSolverLiquidityRequest(): Promise<
  GetSolverLiquidityResponse[]
> {
  const response = await await request({
    url: `${globalConfig.env.nearIntentsBaseURL}solver_liquidity`,
    fetchOptions: {
      method: "GET",
    },
  })

  return response.json()
}

export function useSolverLiquidityQuery() {
  return useQuery({
    queryKey: ["solver_liquidity"],
    queryFn: getSolverLiquidityRequest,
    select: (data) => {
      const liquidityData_: Record<string, bigint> = {}

      for (const { address_from, address_to, validated_amount } of data) {
        liquidityData_[`${address_from}#${address_to}`] =
          BigInt(validated_amount)
      }

      return liquidityData_
    },
  })
}
