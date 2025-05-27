import { useEffect, useState } from "react"

import { getMaxLiquidityData } from "@src/services/SolverLiquidityService"
import type { MaxLiquidityInJson } from "@src/types/interfaces"

export const useLiquidityData = () => {
  const [liquidityData, setLiquidityData] = useState<Record<
    string,
    MaxLiquidityInJson
  > | null>({})

  useEffect(() => {
    getMaxLiquidityData().then((data) => {
      setLiquidityData(data)
    })
  }, [])

  return liquidityData
}
