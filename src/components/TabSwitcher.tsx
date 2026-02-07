import clsx from "clsx"
import type { ReactNode } from "react"
import Button from "./Button"
import TooltipNew from "./DefuseSDK/components/TooltipNew"

type Tab = {
  label: string
  icon: ReactNode
  selected: boolean
  onClick?: () => void
  href?: string
  disabled?: boolean
  disabledTooltip?: string
}

const TabSwitcher = ({
  tabs,
  className,
}: { tabs: [Tab, Tab]; className?: string }) => (
  <div
    className={clsx(
      "bg-surface-active rounded-2xl grid grid-cols-2 gap-1 border border-border p-1",
      className
    )}
  >
    {tabs.map(
      ({ label, icon, selected, disabled, disabledTooltip, ...rest }) => {
        if (disabled && disabledTooltip) {
          return (
            <TooltipNew key={label}>
              <TooltipNew.Trigger>
                <Button
                  variant={selected ? "outline" : "secondary"}
                  size="lg"
                  disabled={disabled}
                  {...rest}
                >
                  {icon}
                  {label}
                </Button>
              </TooltipNew.Trigger>
              <TooltipNew.Content className="max-w-56 text-center text-balance">
                {disabledTooltip}
              </TooltipNew.Content>
            </TooltipNew>
          )
        }

        return (
          <Button
            key={label}
            variant={selected ? "outline" : "secondary"}
            disabled={disabled}
            size="lg"
            {...rest}
          >
            {icon}
            {label}
          </Button>
        )
      }
    )}
  </div>
)

export default TabSwitcher
