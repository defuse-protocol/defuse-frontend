import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { getTokenId } from "@src/components/DefuseSDK/utils/token"
import ListItem from "@src/components/ListItem"
import { SendIcon, SwapIcon } from "@src/icons"
import type { Holding } from "../types/sharedTypes"
import { FormattedCurrency } from "./shared/FormattedCurrency"

const Assets = ({ assets }: { assets: Holding[] | undefined }) => {
  // TODO
  if (!assets) return <div>No assets</div>

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
