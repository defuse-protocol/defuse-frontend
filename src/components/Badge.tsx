import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/16/solid"
import clsx from "clsx"
import type { ReactNode } from "react"

const Badge = ({
  variant,
  children,
}: { variant: "error" | "info" | "success"; children: ReactNode }) => (
  <div
    className={clsx(
      "flex items-center gap-x-1 rounded-lg px-1.5 py-1 text-xs font-semibold group-hover:inset-ring",
      {
        "bg-red-100 text-red-700 group-hover:inset-ring-red-200":
          variant === "error",
        "bg-blue-100 text-blue-700 group-hover:inset-ring-blue-200":
          variant === "info",
        "bg-green-100 text-green-700 group-hover:inset-ring-green-200":
          variant === "success",
      }
    )}
  >
    {variant === "error" && <XCircleIcon className="size-3 text-red-500" />}
    {variant === "info" && <ClockIcon className="size-3 text-blue-500" />}
    {variant === "success" && (
      <CheckCircleIcon className="size-3 text-green-500" />
    )}
    {children}
  </div>
)

export default Badge
