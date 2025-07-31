import { cn } from "@src/components/DefuseSDK/utils/cn"
import type { PropsWithChildren } from "react"

interface GiftHeaderProps extends PropsWithChildren {
  title: string
  className?: string
  icon?: React.ReactNode
}

export function GiftHeader({
  title,
  children,
  className,
  icon,
}: GiftHeaderProps) {
  return (
    <div className="w-full mb-5 flex flex-row justify-between gap-5">
      <div className="flex flex-col justify-between gap-1.5">
        <div className={cn("text-2xl font-black text-gray-12", className)}>
          {title}
        </div>
        {children}
      </div>
      {icon}
    </div>
  )
}
