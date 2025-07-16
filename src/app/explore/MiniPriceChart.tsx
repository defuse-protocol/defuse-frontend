import { cn } from "@src/utils/cn"
import type React from "react"
import type { AlignedData } from "uplot"
import UplotReact from "uplot-react"
import "uplot/dist/uPlot.min.css"

export interface MiniPriceChartProps {
  data: number[]
}

function getYScale(yVals: number[]): { min?: number; max?: number } {
  if (yVals.length === 0) return {}
  const min = Math.min(...yVals)
  const max = Math.max(...yVals)
  if (min === max) {
    return { min: min - 1, max: max + 1 }
  }
  return {}
}

const parseAlignedData = (data: number[]): AlignedData => {
  const xVals = Array.from({ length: data.length }, (_, i) => i)
  return [xVals, data]
}

const MiniPriceChart: React.FC<MiniPriceChartProps> = ({ data }) => {
  if (data.length < 2) return null

  const width = 111
  const height = 47
  const parsedData = parseAlignedData(data)
  const isPositive = data[0] <= data[data.length - 1]
  const stroke = isPositive ? "green" : "red"

  // y-values are in data[1]
  const yVals = parsedData[1]
  const yScale = getYScale(yVals as number[])

  const options = {
    width,
    height,
    autoSize: false,
    scales: { x: { time: false }, y: { ...yScale } },
    axes: [
      { show: false }, // x axis
      { show: false }, // y axis
    ],
    legend: { show: false },
    cursor: { show: false },
    series: [
      {},
      {
        stroke,
        width: 1,
        points: { show: false },
      },
    ],
    pxAlign: 1,
    focus: { alpha: 1 },
    padding: [6, 0, 6, 0] as [number, number, number, number],
    plugins: [],
  }

  // If less than 2 points, render nothing
  if (!yVals || yVals.length < 2) return null

  return (
    <div
      className={cn(
        "block bg-transparent overflow-hidden",
        `w-[${width}px]`,
        `h-[${height}px]`,
        `min-w-[${width}px]`,
        `min-h-[${height}px]`
      )}
    >
      <UplotReact options={options} data={parsedData} />
    </div>
  )
}

export default MiniPriceChart
