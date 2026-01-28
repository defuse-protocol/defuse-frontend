import { XMarkIcon } from "@heroicons/react/24/solid"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { getDefuseAssetId } from "@src/components/DefuseSDK/utils/token"
import DepositPromo from "@src/components/DepositPromo"
import ListItem from "@src/components/ListItem"
import ListItemsSkeleton from "@src/components/ListItemsSkeleton"
import { DepositIcon, SendIcon, SwapIcon } from "@src/icons"
import type { Holding } from "../types/sharedTypes"
import { FormattedCurrency } from "./shared/FormattedCurrency"

const Assets = ({
  assets,
  isPending,
  isError,
}: {
  assets: Holding[] | undefined
  isPending: boolean
  isError: boolean
}) => {
  if (isPending) {
    return (
      <section className="mt-9">
        <h2 className="text-base text-gray-500 font-medium">Assets</h2>
        <ListItemsSkeleton count={3} className="mt-2" loading />
      </section>
    )
  }

  if (isError)
    return (
      <section className="mt-9">
        <h2 className="text-base text-gray-500 font-medium">Assets</h2>
        <div className="relative">
          <ListItemsSkeleton count={3} className="mt-2" />
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
          <ListItemsSkeleton count={3} className="mt-2" />
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
              key={getDefuseAssetId(token)}
              popoverContent={
                <>
                  <Button size="sm" href={`/send?token=${token.symbol}`}>
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
              <AssetComboIcon icon={token.icon} showChainIcon />

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
