import { cn } from "@src/utils/cn"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import type { ReactNode } from "react"

const TooltipNew = ({
  delayDuration = 100,
  children,
}: {
  delayDuration?: number
  children: ReactNode
}) => (
  <TooltipPrimitive.Provider>
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      {children}
    </TooltipPrimitive.Root>
  </TooltipPrimitive.Provider>
)

const TooltipTrigger = ({ children }: { children: ReactNode }) => (
  <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
)

const TooltipContent = ({
  children,
  className,
  side = "bottom",
  sideOffset = 2,
  ...props
}: TooltipPrimitive.TooltipContentProps & { children: ReactNode }) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      collisionPadding={8}
      className={cn(
        "z-100 bg-gray-900 text-white rounded-lg shadow-lg text-xs font-semibold px-2 py-1.5",
        "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:duration-100 data-[state=delayed-open]:ease-in-out",
        {
          "data-[state=delayed-open]:slide-in-from-top-1": side === "bottom",
          "data-[state=delayed-open]:slide-in-from-bottom-1": side === "top",
          "data-[state=delayed-open]:slide-in-from-right-1": side === "left",
          "data-[state=delayed-open]:slide-in-from-left-1": side === "right",
        },
        className
      )}
      side={side}
      sideOffset={sideOffset}
      {...props}
    >
      {children}
      <TooltipPrimitive.Arrow />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
)

TooltipNew.Trigger = TooltipTrigger
TooltipNew.Content = TooltipContent

export default TooltipNew
