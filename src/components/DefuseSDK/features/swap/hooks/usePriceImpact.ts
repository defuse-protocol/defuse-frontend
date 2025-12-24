import { useMemo } from "react"

interface UsePriceImpactProps {
  amountIn: number | null
  amountOut: number | null
}

interface PriceImpactResult {
  status: "favorable" | "unfavorable"
  displayText: string
}

const usePriceImpact = ({
  amountIn,
  amountOut,
}: UsePriceImpactProps): PriceImpactResult | null =>
  useMemo(() => {
    if (amountIn == null || amountOut == null || amountOut === 0) {
      return null
    }

    const impact = amountIn / amountOut - 1

    const moreThan1Percent = impact > 0.01
    const favorable = impact < 0
    const inAcceptableRange = !favorable && !moreThan1Percent

    if (inAcceptableRange) return null

    const sign = favorable ? "+" : "-"
    const displayText = `${sign}${Math.abs(Math.round(impact * 10000) / 100)}%`

    return { status: favorable ? "favorable" : "unfavorable", displayText }
  }, [amountIn, amountOut])

export default usePriceImpact
