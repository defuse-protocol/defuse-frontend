import { ChevronRightIcon } from "@radix-ui/react-icons"
import { cn } from "@src/components/DefuseSDK/utils/cn"
import { QRCodeSVG } from "qrcode.react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/Popover"
import type { TokenInfo, TokenValue } from "../../../types/base"
import { GiftStrip } from "./GiftStrip"

type ShareableGiftImageProps = {
  token: TokenInfo
  amount: TokenValue
  message: string
  link?: string
  className?: string
}

const GIFT_MESSAGE_DISPLAY_LIMIT = 20

export function ShareableGiftImage({
  token,
  amount,
  message,
  link,
  className,
}: ShareableGiftImageProps) {
  return (
    <div
      className={cn(
        "relative w-full min-w-[334px] min-h-[284px] max-w-[600px] h-auto aspect-[1.5/1] rounded-xl flex flex-col justify-center p-10 items-center",
        className
      )}
      style={{
        backgroundImage: 'url("/static/images/gift-blank-card.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "overlay",
      }}
    >
      <div className="flex flex-col items-center gap-4 z-10">
        {link && (
          <div className="flex items-center justify-center bg-white w-32 h-32 p-2 rounded-md">
            <QRCodeSVG value={link} />
          </div>
        )}
        <div className="flex items-center gap-4 z-10 bg-white rounded-full p-1.5">
          <GiftStrip
            token={token}
            amountSlot={
              <GiftStrip.Amount
                token={token}
                amount={amount}
                className="text-lg"
              />
            }
          />
        </div>

        <div className="flex items-center justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-white text-sm md:text-base font-bold text-center group focus:outline-hidden focus:ring-2 focus:ring-primary-500 rounded-sm transition"
                aria-label="Read full message"
                title={message}
                tabIndex={0}
              >
                <span>{getTruncatedMessage(message)}</span>
                {message.length > 20 && (
                  <span className="text-xs text-gray-200 group-hover:text-white group-focus:text-white underline-offset-2 group-hover:underline group-focus:underline flex items-center gap-1 transition-colors">
                    Read full
                    <ChevronRightIcon className="h-3 w-3" />
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-2 text-xs bg-white text-gray-11 shadow-lg rounded-sm p-3 transition-all duration-150">
              <div>{message}</div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}

function getTruncatedMessage(message: string) {
  return message.length > GIFT_MESSAGE_DISPLAY_LIMIT
    ? `${message.slice(0, GIFT_MESSAGE_DISPLAY_LIMIT)}...`
    : message
}
