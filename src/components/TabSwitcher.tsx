import { cn } from "@src/utils/cn"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import type { ReactNode } from "react"
import Button from "./Button"

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
  ...rest
}: Tab) => {
  const button = (
    <Button
      variant={selected ? "outline" : "secondary"}
      size="lg"
      disabled={disabled}
      {...rest}
    >
      {icon}
      {label}
    </Button>
  )

  if (disabled && disabledTooltip) {
    return (
      <TooltipPrimitive.Provider>
        <TooltipPrimitive.Root delayDuration={100}>
          <TooltipPrimitive.Trigger asChild>
            <span className="w-full">{button}</span>
          </TooltipPrimitive.Trigger>
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
