import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/20/solid"
import type { TextareaHTMLAttributes } from "react"

export function GiftMessageInput(
  inputProps: TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const messageLength =
    typeof inputProps.value === "string" ? inputProps.value.length : 0
  const remainingChars =
    inputProps.maxLength != null ? inputProps.maxLength - messageLength : null

  return (
    <div className="mt-2 w-full">
      <label className="flex gap-4 rounded-3xl bg-white p-3 cursor-text outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 outline-gray-200 focus-within:outline-gray-900">
        <div className="shrink-0">
          <div className="bg-gray-100 rounded-full size-10 flex items-center justify-center">
            <ChatBubbleBottomCenterTextIcon className="size-5 text-gray-500" />
          </div>
          {messageLength > 0 && (
            <div className="mt-2 bg-gray-100 rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 font-mono text-center">
              {remainingChars}
            </div>
          )}
        </div>
        <div className="flex-1 min-h-10 pt-2.5">
          <span className="sr-only">Message</span>
          <textarea
            id="gift-message"
            placeholder="Add a message (optional)"
            autoComplete="off"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            rows={5}
            className="block w-full text-gray-900 font-semibold placeholder:text-gray-400 focus:outline-none text-base/5 ring-0 border-none p-0"
            {...inputProps}
          />
        </div>
      </label>
    </div>
  )
}
