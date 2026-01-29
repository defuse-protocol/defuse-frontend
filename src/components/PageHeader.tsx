import clsx from "clsx"
import type { ReactNode } from "react"

type Props = {
  title: string
  subtitle?: string
  className?: string
  children?: ReactNode
}

const PageHeader = ({ title, subtitle, className, children }: Props) => (
  <div className={clsx("flex justify-between items-center", className)}>
    <div>
      <h1 className="text-gray-900 text-xl font-semibold tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-gray-500 text-sm font-medium">{subtitle}</p>
      )}
    </div>
    {children && <div>{children}</div>}
  </div>
)

export default PageHeader
