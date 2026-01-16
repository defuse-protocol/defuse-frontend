import { ChevronDownIcon } from "@heroicons/react/20/solid"
import clsx from "clsx"
import {
  type ButtonHTMLAttributes,
  type ForwardedRef,
  type ReactNode,
  forwardRef,
} from "react"

interface SelectTriggerLikeProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  label: string
  value?: string
  hint?: string
  error?: string
}

function SelectTriggerLike(
  {
    icon,
    label,
    value,
    disabled,
    className,
    hint,
    error,
    ...props
  }: SelectTriggerLikeProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={clsx(
        "rounded-3xl bg-white border border-gray-200 p-4 not-disabled:hover:border-gray-700 not-disabled:hover:outline not-disabled:hover:outline-gray-700 focus-visible:border-gray-700 focus-visible:outline focus-visible:outline-gray-700 text-left flex items-center gap-3",
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-3 flex-1">
        {icon}
        <span className="flex flex-col items-start gap-1">
          {value && (
            <span
              className={clsx(
                "text-sm/none font-medium",
                error ? "text-red-600" : "text-gray-500"
              )}
            >
              {error || label}
            </span>
          )}
          <span
            className={clsx(
              "text-base/none font-semibold",
              error ? "text-red-600" : "text-gray-700"
            )}
          >
            {value || error || label}
          </span>
        </span>
      </span>
      {hint && (
        <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
          <span className="size-1.5 rounded-full bg-green-500 shrink-0" />
          {hint}
        </span>
      )}
      {!disabled && <ChevronDownIcon className="size-6 text-gray-500" />}
    </button>
  )
}

const SelectTriggerLikeWithRef = forwardRef(SelectTriggerLike)

export { SelectTriggerLikeWithRef as SelectTriggerLike }
