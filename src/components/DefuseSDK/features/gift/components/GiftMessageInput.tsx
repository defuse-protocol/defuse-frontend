import { ChatTextIcon } from "@phosphor-icons/react"
import clsx from "clsx"
import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react"

export function GiftMessageInput({
  inputSlot,
  countSlot,
  hasValue = false,
}: {
  inputSlot?: ReactNode
  countSlot?: ReactNode
  hasValue?: boolean
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-2xl bg-white p-3 border transition-all duration-200",
        hasValue
          ? "border-gray-900 outline outline-1 outline-gray-900"
          : "border-gray-200 hover:border-gray-300",
        "focus-within:!border-gray-400 focus-within:!outline focus-within:!outline-1 focus-within:!outline-gray-400"
      )}
    >
      <div
        className={clsx(
          "size-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
          hasValue ? "bg-gray-900" : "bg-gray-100"
        )}
      >
        <ChatTextIcon
          weight="bold"
          className={clsx("size-5", hasValue ? "text-white" : "text-gray-500")}
        />
      </div>
      <div className="flex-1 min-w-0">{inputSlot}</div>
      <div className="shrink-0">{countSlot}</div>
    </div>
  )
}

GiftMessageInput.Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input(props, ref) {
  return (
    <input
      ref={ref}
      type="text"
      inputMode="text"
      autoComplete="off"
      placeholder="Add a message (optional)"
      className="w-full border-0 bg-transparent font-semibold text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
      {...props}
    />
  )
})

GiftMessageInput.DisplayCount = function DisplayCount({
  count,
}: { count: number }) {
  return (
    <span className="text-xs font-medium text-gray-400 tabular-nums">
      {count}
    </span>
  )
}
