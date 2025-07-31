import type { ReactNode } from "react"
import { cn } from "../utils/cn"

export function IslandHeader({
  heading,
  condensed = false,
  rightSlot,
}: { heading: ReactNode; condensed?: boolean; rightSlot?: ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center",
        !condensed && "px-5 -mt-5 -mx-5 h-[68px] border-b border-border"
      )}
    >
      <div className="flex-1 text-2xl font-black">{heading}</div>

      {rightSlot}
    </div>
  )
}
