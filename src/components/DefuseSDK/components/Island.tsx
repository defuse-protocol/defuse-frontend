import type { ReactNode } from "react"
import { cn } from "../utils/cn"

export function Island({
  children,
  className,
}: { children: ReactNode; className?: string }): ReactNode {
  return (
    <div
      className={cn(
        "rounded-3xl bg-gray-1/95 backdrop-blur-xl shadow-2xl p-6",
        className
      )}
    >
      {children}
    </div>
  )
}
