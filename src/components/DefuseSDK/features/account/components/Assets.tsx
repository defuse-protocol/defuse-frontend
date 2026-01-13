import { XMarkIcon } from "@heroicons/react/24/solid"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import type {
  BaseTokenInfo,
  TokenInfo,
} from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { getTokenId } from "@src/components/DefuseSDK/utils/token"
import DepositPromo from "@src/components/DepositPromo"
import ListItem from "@src/components/ListItem"
import type { SwapTransaction } from "@src/features/balance-history/types"
import { DepositIcon, SendIcon, SwapIcon } from "@src/icons"
import clsx from "clsx"
import { useMemo } from "react"
import type { Holding } from "../types/sharedTypes"
import { FormattedCurrency } from "./shared/FormattedCurrency"

function findTokenByAssetId(
  tokenList: TokenInfo[],
  tokenId: string
): BaseTokenInfo | undefined {
  for (const token of tokenList) {
    if ("groupedTokens" in token) {
      for (const t of token.groupedTokens) {
        if (t.defuseAssetId === tokenId) return t
      }
    } else if (token.defuseAssetId === tokenId) {
      return token
    }
  }
  return undefined
}

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
  pendingTransactions = [],
  tokenList = [],
}: {
  assets: Holding[] | undefined
  isPending: boolean
  isError: boolean
  pendingTransactions?: SwapTransaction[]
  tokenList?: TokenInfo[]
}) => {
  const pendingSwaps = useMemo(() => {
    return pendingTransactions.map((tx) => {
      const fromToken = findTokenByAssetId(tokenList, tx.from.token_id)
      const toToken = findTokenByAssetId(tokenList, tx.to.token_id)
      return { tx, fromToken, toToken }
    })
  }, [pendingTransactions, tokenList])
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
        <div className="relative">
          <AssetsSkeleton count={3} className="mt-2" />
        </div>
        <div className="max-w-72 mx-auto -mt-5 relative flex flex-col items-center">
          <h3 className="text-xl font-semibold text-gray-900 text-center tracking-tight">
            No assets yet
          </h3>
          <p className="text-base text-gray-500 mt-1 font-medium text-center text-balance">
            Deposit crypto or make a bank transfer to get started.
          </p>
          <Button href="/deposit" size="xl" className="mt-4" fullWidth>
            <DepositIcon className="size-4 shrink-0 -mt-1.5" />
            Add funds
          </Button>

          <DepositPromo className="mt-6" />
        </div>
      </section>
    )
  }

  return (
    <>
      {pendingSwaps.length > 0 && (
        <section className="mt-6">
          <div className="flex flex-col gap-2">
            {pendingSwaps.map(({ tx, fromToken, toToken }) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl"
              >
                <div className="size-3 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {fromToken && (
                    <img
                      src={fromToken.icon}
                      alt={fromToken.symbol}
                      className="size-5 rounded-full"
                    />
                  )}
                  <span className="text-sm text-amber-800 truncate">
                    {tx.from.amount} {fromToken?.symbol ?? "???"}
                  </span>
                  <span className="text-amber-600">→</span>
                  {toToken && (
                    <img
                      src={toToken.icon}
                      alt={toToken.symbol}
                      className="size-5 rounded-full"
                    />
                  )}
                  <span className="text-sm text-amber-800 truncate">
                    {toToken?.symbol ?? "???"}
                  </span>
                </div>
                <span className="text-xs text-amber-600 shrink-0">
                  {tx.status === "PROCESSING" ? "Processing" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

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
    </>
  )
}

export default Assets
