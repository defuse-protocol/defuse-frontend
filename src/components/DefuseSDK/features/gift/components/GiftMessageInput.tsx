import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/20/solid"
import type { InputHTMLAttributes } from "react"

export function GiftMessageInput(
  inputProps: InputHTMLAttributes<HTMLInputElement>
) {
  const messageLength =
    typeof inputProps.value === "string" ? inputProps.value.length : 0
  const remainingChars =
    inputProps.maxLength != null ? inputProps.maxLength - messageLength : null

  return (
    <div className="mt-2 w-full">
      <label className="flex items-center gap-3 rounded-3xl bg-white p-3 cursor-text outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 outline-gray-200 focus-within:outline-gray-900">
        <div className="bg-gray-100 rounded-full size-10 shrink-0 flex items-center justify-center">
          <ChatBubbleBottomCenterTextIcon className="size-5 text-gray-500" />
        </div>
        <div className="flex-1">
          <span className="sr-only">Message</span>
          <input
            id="gift-message"
            type="text"
            placeholder="Add a message (optional)"
            autoComplete="off"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            className="block w-full text-gray-900 font-semibold placeholder:text-gray-400 focus:outline-none text-base leading-none ring-0 border-none p-0"
            {...inputProps}
          />
        </div>
        {messageLength > 0 && (
          <div className="shrink-0 bg-gray-100 rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 font-mono">
            {remainingChars}
          </div>
        )}
      </label>
    </div>
  )
}
