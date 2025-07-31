import { clsx } from "clsx"
import { type FC, useMemo } from "react"

interface SwapPriceImpactProps {
  amountIn: number | null
  amountOut: number | null
}

export const SwapPriceImpact: FC<SwapPriceImpactProps> = ({
  amountIn,
  amountOut,
}) => {
  if (amountIn == null || amountOut == null) {
    return null
  }

  if (amountOut === 0) {
    return null
  }

  const impact = amountIn / amountOut - 1
  const moreThan1Percent = impact > 0.01
  const goodImpact = impact < 0
  const inAcceptableRange = !goodImpact && !moreThan1Percent

  if (inAcceptableRange) {
    return null // show nothing
  }

  const impactText = useMemo(() => {
    const directionSymbol = goodImpact ? "+" : "-"
    return `${directionSymbol}${Math.abs(Math.round(impact * 100 * 100) / 100)}%`
  }, [impact, goodImpact])

  return (
    <div className="flex justify-between items-center flex-1 text-gray-11 text-xs font-medium">
      <div>Price Impact</div>
      <div
        className={clsx({
          "text-green-a11": goodImpact,
          "text-red-a11": !goodImpact,
        })}
      >
        {impactText}
      </div>
    </div>
  )
}
