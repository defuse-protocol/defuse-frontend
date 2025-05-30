import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { getSolverLiquidity } from "@src/features/solver_liquidity/lib/solverLiquidityApi"

export const useLiquidityData = () => {
  const [liquidityData, setLiquidityData] = useState<Record<
    string,
    bigint
  > | null>({})

  const { data, isLoading } = useQuery({
    queryKey: ["solver_liquidity"],
    queryFn: getSolverLiquidity,
  })

  useEffect(() => {
    if (!isLoading && data) {
      const liquidityData_: Record<string, bigint> = {}

      for (const { address_from_to, validated_amount } of data) {
        liquidityData_[address_from_to] = BigInt(validated_amount)
      }

      setLiquidityData(liquidityData_)
    }
  }, [data, isLoading])

  return liquidityData
}
