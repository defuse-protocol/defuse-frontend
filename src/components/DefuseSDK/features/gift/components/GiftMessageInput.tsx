import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react"

export function GiftMessageInput({
  inputSlot,
  countSlot,
}: {
  inputSlot?: ReactNode
  countSlot?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border-0 bg-gray-3 hover:bg-gray-4 focus-within:bg-gray-4">
      <div className="flex items-center gap-4">
        {/* Text Input */}
        <div className="relative flex-1">
          <div className="overflow-hidden">{inputSlot}</div>
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-transparent" />
        </div>

        {/* Text Count */}
        <div className="shrink-0">{countSlot}</div>
      </div>
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
      placeholder="Enter your message (optional)"
      className="w-full border-0 bg-transparent px-4 py-2 font-medium text-sm text-label focus:ring-0 outline-none"
      {...props}
    />
  )
})

GiftMessageInput.DisplayCount = function DisplayCount({
  count,
}: { count: number }) {
  return (
    <div className="text-sm font-bold text-gray-a11 px-2 mx-4 rounded-full bg-gray-a3">
      {count}
    </div>
  )
}
