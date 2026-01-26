import { ChatText } from "@phosphor-icons/react"
import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react"

export function GiftMessageInput({
  inputSlot,
  countSlot,
}: {
  inputSlot?: ReactNode
  countSlot?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 border border-gray-200 hover:border-gray-400 focus-within:border-gray-900 focus-within:outline focus-within:outline-1 focus-within:outline-gray-900 transition-colors">
      <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
        <ChatText weight="bold" className="size-5 text-gray-500" />
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
