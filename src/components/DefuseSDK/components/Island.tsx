import type { ReactNode } from "react"
import { cn } from "../utils/cn"

export function Island({
  children,
  className,
}: { children: ReactNode; className?: string }): ReactNode {
  return (
    <div className={cn("rounded-2xl bg-gray-1 shadow-sm p-5", className)}>
      {children}
    </div>
  )
}
