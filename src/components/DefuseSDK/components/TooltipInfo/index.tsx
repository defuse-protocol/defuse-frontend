import type { ReactNode } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "../Popover"

/**
 * @deprecated Use Tooltip instead
 */
export const TooltipInfo = ({
  children,
  icon,
}: { children: ReactNode; icon: ReactNode }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>{icon}</PopoverTrigger>
      <PopoverContent className="text-xs p-3">{children}</PopoverContent>
    </Popover>
  )
}
