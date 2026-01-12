import { XMarkIcon } from "@heroicons/react/24/solid"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { getTokenId } from "@src/components/DefuseSDK/utils/token"
import DepositPromo from "@src/components/DepositPromo"
import ListItem from "@src/components/ListItem"
import { SendIcon, SwapIcon } from "@src/icons"
import clsx from "clsx"
import Link from "next/link"
import type { Holding } from "../types/sharedTypes"
import { FormattedCurrency } from "./shared/FormattedCurrency"

const AssetsSkeleton = ({
  count,
  loading = false,
  className,
}: { count: number; loading?: boolean; className?: string }) => (
  <div className={clsx("flex flex-col gap-1", className)}>
    {[...Array(count).keys()].map((n) => (
      <div key={n} className="flex items-center gap-3 py-3">
        <div
          className={clsx(
            "size-10 rounded-full shrink-0",
            loading ? "bg-gray-200 animate-pulse" : "bg-gray-100"
          )}
        />
        <div className="flex-1 flex flex-col gap-1">
          <div
            className={clsx(
              "h-4 w-12 rounded-sm",
              loading ? "bg-gray-200 animate-pulse" : "bg-gray-100"
            )}
          />
          <div
            className={clsx(
              "h-4 w-6 rounded-sm",
              loading ? "bg-gray-200 animate-pulse" : "bg-gray-100"
            )}
          />
        </div>
        <div className="flex flex-col gap-1 items-end">
          <div
            className={clsx(
              "h-4 w-12 rounded-sm",
              loading ? "bg-gray-200 animate-pulse" : "bg-gray-100"
            )}
          />
          <div
            className={clsx(
              "h-4 w-6 rounded-sm",
              loading ? "bg-gray-200 animate-pulse" : "bg-gray-100"
            )}
          />
        </div>
      </div>
    ))}
  </div>
)

const Assets = ({
  assets,
  isPending,
  isError,
}: { assets: Holding[] | undefined; isPending: boolean; isError: boolean }) => {
  if (isPending) {
    return (
      <section className="mt-9">
        <h2 className="text-base text-gray-500 font-medium">Assets</h2>
        <AssetsSkeleton count={3} className="mt-2" loading />
      </section>
    )
  }

  if (isError)
    return (
      <section className="mt-9">
        <h2 className="text-base text-gray-500 font-medium">Assets</h2>
        <div className="relative">
          <AssetsSkeleton count={3} className="mt-2" />
        </div>
        <div className="max-w-96 mx-auto -mt-16 relative flex flex-col items-center">
          <div className="bg-red-100 flex items-center justify-center size-12 rounded-full shrink-0">
            <XMarkIcon className="size-6 text-red-600" aria-hidden />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-gray-900 text-center tracking-tight">
            Something went wrong
          </h3>
          <p className="text-base text-gray-500 mt-1 font-medium text-center text-balance">
            We couldn’t load your assets right now. Your funds are safe. Try
            refreshing the page.
          </p>
        </div>
      </section>
    )

  if (!assets || assets.length === 0) {
    return (
      <section className="mt-9">
        <h2 className="sr-only">Assets</h2>
        <div className="relative rounded-3xl bg-white border border-gray-200 p-4 hover:border-gray-700 hover:outline hover:outline-gray-700 has-focus-visible:border-gray-700 has-focus-visible:outline has-focus-visible:outline-gray-700">
          <Link
            href="/deposit/crypto"
            className="text-gray-900 text-lg font-semibold focus-visible:outline-none"
          >
            <span className="absolute inset-0 rounded-3xl" />
            Deposit crypto
          </Link>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Send crypto from an external wallet
          </p>

          <DepositPromo className="mt-9" />
        </div>
      </section>
    )
  }

  return (
    <section className="mt-9">
      <h2 className="text-base text-gray-500 font-medium">Assets</h2>
      <div className="mt-2 flex flex-col gap-1">
        {assets.map(({ token, value, usdValue }) => {
          const shortFormatted = value
            ? formatTokenValue(value.amount, value.decimals, {
                fractionDigits: 4,
                min: 0.0001,
              })
            : undefined

          const toTokenSymbol = token.symbol === "NEAR" ? "ETH" : "NEAR"

          return (
            <ListItem
              key={getTokenId(token)}
              popoverContent={
                <>
                  <Button size="sm" href="/send">
                    <SendIcon className="size-4 shrink-0" />
                    Send
                  </Button>
                  <Button
                    size="sm"
                    href={`/swap?from=${token.symbol}&to=${toTokenSymbol}`}
                  >
                    <SwapIcon className="size-4 shrink-0" />
                    Swap
                  </Button>
                </>
              }
            >
              <AssetComboIcon
                icon={token.icon}
                name={token.name}
                showChainIcon
              />

              <ListItem.Content>
                <ListItem.Title>{token.name}</ListItem.Title>
                <ListItem.Subtitle>{token.symbol}</ListItem.Subtitle>
              </ListItem.Content>

              <ListItem.Content align="end">
                <ListItem.Title>
                  <FormattedCurrency
                    value={usdValue ?? 0}
                    formatOptions={{ currency: "USD" }}
                  />
                </ListItem.Title>
                <ListItem.Subtitle>{shortFormatted ?? "-"}</ListItem.Subtitle>
              </ListItem.Content>
            </ListItem>
          )
        })}
      </div>
    </section>
  )
}

export default Assets
