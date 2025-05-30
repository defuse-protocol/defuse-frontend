import type { GetSolverLiquidityResponse } from "@src/features/solver_liquidity/types/solverLiquidityTypes"
import { BASE_URL } from "@src/utils/environment"

export async function getSolverLiquidity() {
  const response = await fetch(`${BASE_URL}/api/solver_liquidity`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to get solver liquidity")
  }

  return response.json() as Promise<GetSolverLiquidityResponse[]>
}
