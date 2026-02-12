import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/20/solid"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import Spinner from "@src/components/Spinner"
import clsx from "clsx"
import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"
import type { TokenInfo, TokenValue } from "../../../types/base"

type ShareableGiftImageProps = {
  token: TokenInfo
  amount: TokenValue
  message: string
  link?: string
  className?: string
}

const GIFT_MESSAGE_DISPLAY_LIMIT = 20

function getTruncatedMessage(message: string) {
  return message.length > GIFT_MESSAGE_DISPLAY_LIMIT
    ? `${message.slice(0, GIFT_MESSAGE_DISPLAY_LIMIT)}...`
    : message
}

export function ShareableGiftImage({
  token,
  amount,
  message,
  link,
}: ShareableGiftImageProps) {
  const [showFullMessage, setShowFullMessage] = useState(false)
  const isTruncatedMessage = message.length > GIFT_MESSAGE_DISPLAY_LIMIT

  return (
    <div className="mt-4">
      <div className="relative flex items-center justify-center bg-gray-800 rounded-3xl py-8 px-4 overflow-hidden">
        <div className="absolute size-64 -bottom-52 left-1/2 -translate-x-1/2 rounded-full bg-green-500/80 blur-[100px] pointer-events-none" />

        <div className="relative size-48 flex items-center justify-center border-5 rounded-3xl bg-white border-gray-900">
          {link ? (
            <QRCodeSVG
              value={link}
              size={160}
              fgColor="#171717"
              className="size-40"
            />
          ) : (
            <Spinner />
          )}
        </div>
      </div>

      <div className="px-4 pb-4 pt-12 rounded-b-3xl bg-white border-2 border-gray-200 -mt-8 space-y-4">
        <div className="flex items-center gap-3">
          <AssetComboIcon {...token} sizeClassName="size-8" />
          <span className="text-sm font-semibold text-gray-900">
            {formatTokenValue(amount.amount, amount.decimals, {
              fractionDigits: 6,
            })}{" "}
            {token.symbol}
          </span>
        </div>

        <div
          className={clsx("flex gap-3", { "items-center": !showFullMessage })}
        >
          <div className="bg-gray-100 rounded-full size-8 shrink-0 flex items-center justify-center outline-1 outline-gray-900/10 -outline-offset-1">
            <ChatBubbleBottomCenterTextIcon className="size-5 text-gray-500" />
          </div>
          <p className="text-sm font-semibold text-gray-900">
            <span>
              {showFullMessage ? message : getTruncatedMessage(message)}
            </span>
            {!showFullMessage && isTruncatedMessage && (
              <button
                type="button"
                className="underline text-left ml-1"
                onClick={() => setShowFullMessage(true)}
              >
                Read more
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
