import type { ReactNode } from "react"
import Button from "./Button"

type Tab = {
  label: string
  icon: ReactNode
  selected: boolean
  onClick?: () => void
  href?: string
}

const TabSwitcher = ({ tabs }: { tabs: [Tab, Tab] }) => (
  <div className="bg-gray-100 rounded-2xl grid grid-cols-2 gap-1 border border-gray-200 p-1 mt-8">
    {tabs.map(({ label, icon, selected, ...rest }) => (
      <Button
        key={label}
        variant={selected ? "outline" : "secondary"}
        size="lg"
        {...rest}
      >
        {icon}
        {label}
      </Button>
    ))}
  </div>
)

export default TabSwitcher
