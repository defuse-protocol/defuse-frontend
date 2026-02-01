import { cn } from "@src/utils/cn"
import clsx from "clsx"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import type { ReactNode } from "react"

type Tab = {
  label: string
  icon: ReactNode
  selected: boolean
  onClick?: () => void
  href?: string
  disabled?: boolean
  disabledTooltip?: string
}

const TabButton = ({
  label,
  icon,
  selected,
  disabled,
  disabledTooltip,
  onClick,
}: Tab) => {
  const buttonClasses = clsx(
    "items-center relative flex shrink-0 justify-center leading-none tracking-tight h-10 px-4 text-sm font-bold rounded-xl w-full text-gray-700",
    selected ? "bg-white border border-gray-200" : "bg-gray-100",
    disabled
      ? "cursor-not-allowed opacity-50"
      : "hover:bg-gray-200 cursor-pointer"
  )

  const button = (
    <button
      type="button"
      className={buttonClasses}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      <span className="flex items-center gap-x-2">
        {icon}
        {label}
      </span>
    </button>
  )

  if (disabled && disabledTooltip) {
    return (
      <TooltipPrimitive.Provider>
        <TooltipPrimitive.Root delayDuration={100}>
          <TooltipPrimitive.Trigger asChild>{button}</TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              className={cn(
                "bg-gray-900 text-white rounded-lg shadow-lg text-xs font-semibold px-2 py-1.5 max-w-64 text-center",
                "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:duration-100 data-[state=delayed-open]:ease-in-out",
                "data-[state=delayed-open]:slide-in-from-top-1"
              )}
              side="bottom"
              sideOffset={4}
            >
              {disabledTooltip}
              <TooltipPrimitive.Arrow />
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    )
  }

  return button
}

const TabSwitcher = ({ tabs }: { tabs: [Tab, Tab] }) => (
  <div className="bg-gray-100 rounded-2xl grid grid-cols-2 gap-1 border border-gray-200 p-1 mt-6">
    {tabs.map((tab) => (
      <TabButton key={tab.label} {...tab} />
    ))}
  </div>
)

export default TabSwitcher
