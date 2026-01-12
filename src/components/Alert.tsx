import { InformationCircleIcon, XCircleIcon } from "@heroicons/react/20/solid"
import { cn } from "@src/utils/cn"
import type { ReactNode } from "react"
import ErrorMessage from "./ErrorMessage"

const Alert = ({
  variant,
  className,
  children,
}: {
  variant: "error" | "info"
  className?: string
  children: ReactNode
}) => {
  const baseClasses = "pl-3 pr-6 py-3 rounded-2xl flex items-start gap-3"

  if (variant === "error") {
    return (
      <div className={cn("bg-red-50", baseClasses, className)}>
        <XCircleIcon className="size-5 shrink-0 text-red-600" aria-hidden />
        <ErrorMessage>{children}</ErrorMessage>
      </div>
    )
  }

  if (variant === "info") {
    return (
      <div className={cn("bg-blue-50", baseClasses, className)}>
        <InformationCircleIcon
          className="size-5 shrink-0 text-blue-400"
          aria-hidden
        />
        <div className="text-blue-700 text-sm/5 font-semibold">{children}</div>
      </div>
    )
  }

  return null
}

export default Alert
