import { ChevronDownIcon } from "@radix-ui/react-icons"
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
  hint?: ReactNode
  isPlaceholder?: boolean
}

function SelectTriggerLike(
  {
    icon,
    label,
    hint,
    isPlaceholder = false,
    className,
    ...props
  }: SelectTriggerLikeProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  return (
    <button
      ref={ref}
      {...props}
      type="button"
      className={clsx(
        "inline-flex h-12 items-center gap-2.5 rounded-lg bg-gray-3 px-4 text-gray-12 hover:bg-gray-4",
        className
      )}
    >
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}

          <div
            className={clsx(
              "text-sm",
              isPlaceholder ? "font-medium text-gray-11" : "font-bold"
            )}
          >
            {label}
          </div>
        </div>

        {hint}
      </div>

      <div className="flex-shrink-0">
        <ChevronDownIcon className="size-7" />
      </div>
    </button>
  )
}

const SelectTriggerLikeWithRef = forwardRef(SelectTriggerLike)

export { SelectTriggerLikeWithRef as SelectTriggerLike }
