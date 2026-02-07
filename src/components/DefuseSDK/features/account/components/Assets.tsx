import { ChevronDownIcon } from "@heroicons/react/16/solid"
import { XMarkIcon } from "@heroicons/react/24/solid"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { getDefuseAssetId } from "@src/components/DefuseSDK/utils/token"
import DepositPromo from "@src/components/DepositPromo"
import EmptyState from "@src/components/EmptyState"
import ListItem from "@src/components/ListItem"
import ListItemsSkeleton from "@src/components/ListItemsSkeleton"
import { DepositIcon, SendIcon, SwapIcon } from "@src/icons"
import { useState } from "react"
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
  const [showAll, setShowAll] = useState(false)

  const hasMore = assets ? !showAll && assets.length >= 7 : false
  const assetsToShow = assets ? (hasMore ? assets.slice(0, 5) : assets) : []

  if (isPending) {
    return (
      <>
        <h2 className="text-base text-fg-secondary font-medium">Assets</h2>
        <ListItemsSkeleton count={3} className="mt-2" loading />
      </>
    )
  }

  if (isError) {
    return (
      <EmptyState>
        <div className="bg-red-100 flex items-center justify-center size-12 rounded-full shrink-0">
          <XMarkIcon className="size-6 text-red-600" aria-hidden />
        </div>
        <EmptyState.Title>Something went wrong</EmptyState.Title>
        <EmptyState.Description>
          We couldn’t load your assets right now. Your funds are safe. Try
          refreshing the page.
        </EmptyState.Description>
      </EmptyState>
    )
  }

  if (!assets || assets.length === 0) {
    return (
      <EmptyState>
        <EmptyState.Title>No assets yet</EmptyState.Title>
        <EmptyState.Description>
          Deposit crypto or make a bank transfer to get started.
        </EmptyState.Description>
        <Button href="/deposit" size="xl" className="mt-4" fullWidth>
          <DepositIcon className="size-6 shrink-0 -mt-1.5" />
          Add funds
        </Button>
        <DepositPromo className="mt-6" />
      </EmptyState>
    )
  }

  return (
    <>
      <h2 className="text-base text-fg-secondary font-medium">Assets</h2>
      <div className="mt-2 flex flex-col gap-1">
        {assetsToShow.map(({ token, value, usdValue }) => {
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
              popoverItems={[
                {
                  label: "Transfer",
                  href: `/transfer?token=${token.symbol}`,
                  icon: SendIcon,
                },
                {
                  label: "Swap",
                  href: `/swap?from=${token.symbol}&to=${toTokenSymbol}`,
                  icon: SwapIcon,
                },
              ]}
            >
              <AssetComboIcon icon={token.icon} showChainIcon />

              <ListItem.Content>
                <ListItem.Title>{token.symbol}</ListItem.Title>
                <ListItem.Subtitle>{token.name}</ListItem.Subtitle>
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
      {hasMore && (
        <Button
          onClick={() => setShowAll(true)}
          size="lg"
          className="mt-4"
          fullWidth
          variant="secondary"
        >
          <ChevronDownIcon className="size-5 shrink-0" />
          Show all
        </Button>
      )}
    </>
  )
}

export default Assets
