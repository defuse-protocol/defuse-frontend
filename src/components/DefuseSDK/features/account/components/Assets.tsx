import * as Popover from "@radix-ui/react-popover"
import { AssetComboIcon } from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { getTokenId } from "@src/components/DefuseSDK/utils/token"
import { SendIcon, SwapIcon } from "@src/icons"
import clsx from "clsx"
import Link from "next/link"
import { useState } from "react"
import type { Holding } from "../types/sharedTypes"
import { FormattedCurrency } from "./shared/FormattedCurrency"

const Assets = ({ assets }: { assets: Holding[] | undefined }) => {
  if (!assets) return <div>No assets</div>

  return (
    <section className="mt-9">
      <h2 className="text-base text-gray-500">Assets</h2>
      <div className="mt-2">
        {assets.map((asset) => (
          <Asset key={getTokenId(asset.token)} asset={asset} />
        ))}
      </div>
    </section>
  )
}

const Asset = ({ asset }: { asset: Holding }) => {
  const { token, value, usdValue } = asset
  const [isOpen, setIsOpen] = useState(false)

  const formatted = value
    ? formatTokenValue(value.amount, value.decimals)
    : undefined

  const shortFormatted = value
    ? formatTokenValue(value.amount, value.decimals, {
        fractionDigits: 4,
        min: 0.0001,
      })
    : undefined

  const toTokenSymbol = token.symbol === "NEAR" ? "ETH" : "NEAR"

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={clsx(
          "relative -mx-4 px-4 rounded-2xl",
          isOpen ? "bg-gray-100" : "hover:bg-gray-100"
        )}
      >
        <div className="relative flex gap-3 items-center py-3">
          <AssetComboIcon icon={token.icon} name={token.name} showChainIcon />

          <div className="flex-1 flex flex-col items-start gap-1">
            <div className="text-base font-medium text-gray-900 leading-none">
              {token.name}
            </div>
            <div className="text-sm leading-none text-gray-500">
              {token.symbol}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {usdValue === null ? (
              "-"
            ) : (
              <FormattedCurrency
                value={usdValue ?? 0}
                formatOptions={{ currency: "USD" }}
                className="text-base font-medium text-gray-900 leading-none"
              />
            )}
            <div
              className="text-sm leading-none text-gray-500 text-right"
              title={formatted}
            >
              {shortFormatted ?? "-"} {token.symbol}
            </div>
          </div>
        </div>

        <Popover.Trigger
          type="button"
          className="absolute z-10 inset-0 rounded-2xl"
          aria-label="Open menu"
        />
      </div>
      <Popover.Portal>
        <Popover.Content
          className="bg-gray-900 rounded-xl shadow-lg flex p-1 gap-1 data-[state=open]:animate-in data-[state=open]:slide-in-from-top-1 duration-200 ease-in-out fade-in"
          sideOffset={-5}
        >
          <Popover.Arrow />
          <Link
            href="/send"
            className="flex items-center gap-1.5 px-3 h-8 text-white font-medium text-sm rounded-lg hover:bg-gray-700"
          >
            <SendIcon className="size-4 shrink-0" />
            Send
          </Link>
          <Link
            href={`/swap?from=${token.symbol}&to=${toTokenSymbol}`}
            className="flex items-center gap-1.5 px-3 h-8 text-white font-medium text-sm rounded-lg hover:bg-gray-700"
          >
            <SwapIcon className="size-4 shrink-0" />
            Swap
          </Link>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default Assets
