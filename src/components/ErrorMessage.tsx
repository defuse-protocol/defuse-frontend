import clsx from "clsx"
import type { ReactNode } from "react"

const ErrorMessage = ({
  children,
  className,
}: { children?: ReactNode; className?: string }) => {
  if (!children) return null

  return (
    <div className={clsx("text-red-600 text-sm/5 font-semibold", className)}>
      {children}
    </div>
  )
}

export default ErrorMessage
