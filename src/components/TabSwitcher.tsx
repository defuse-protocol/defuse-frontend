import type { ReactNode } from "react"
import Button from "./Button"
import TooltipNew from "./DefuseSDK/components/TooltipNew"
import HelperPopover from "./HelperPopover"

type Tab = {
  label: string
  icon: ReactNode
  selected: boolean
  onClick?: () => void
  href?: string
  disabled?: boolean
  disabledTooltip?: string
}

const TabSwitcher = ({ tabs }: { tabs: [Tab, Tab] }) => (
  <div className="mt-8">
    <div className="flex items-center gap-2">
      <h3 className="text-gray-900 text-lg font-semibold tracking-tight">
        How do you want to deposit?
      </h3>

      <HelperPopover>
        You can deposit directly from a connected wallet, or send to a deposit
        address using any wallet.
      </HelperPopover>
    </div>
    <div className="mt-4 bg-gray-100 rounded-2xl grid grid-cols-2 gap-1 border border-gray-200 p-1">
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
  </div>
)

export default TabSwitcher
