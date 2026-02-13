import clsx from "clsx"
import type { ReactNode } from "react"
import HelperPopover from "./HelperPopover"

type Props = {
  title: string
  subtitle?: string
  className?: string
  intro?: ReactNode
  children?: ReactNode
}

const PageHeader = ({ title, subtitle, className, intro, children }: Props) => (
  <div className={clsx("flex justify-between items-center gap-3", className)}>
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-fg text-xl font-semibold tracking-tight">
          {title}
        </h1>

        {intro && <HelperPopover>{intro}</HelperPopover>}
      </div>
      {subtitle && (
        <p className="mt-1 text-fg-secondary text-sm font-medium text-pretty">
          {subtitle}
        </p>
      )}
    </div>
    {children && <div>{children}</div>}
  </div>
)

export default PageHeader
