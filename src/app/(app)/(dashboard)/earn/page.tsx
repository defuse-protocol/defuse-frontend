"use client"

import { FormattedCurrency } from "@src/components/DefuseSDK/features/account/components/shared/FormattedCurrency"
import EarnPromo from "@src/components/EarnPromo"
import ListItem from "@src/components/ListItem"
import { BtcIcon, EthIcon, NearIcon, UsdcIcon } from "@src/icons"

const PLACEHOLDER_VAULTS = [
  {
    token: "USDC",
    icon: UsdcIcon,
    apr: "8.2%",
    balance: "12,300",
  },
  {
    token: "ETH",
    icon: EthIcon,
    apr: "4.5%",
    balance: "4.2",
  },
  {
    token: "BTC",
    icon: BtcIcon,
    apr: "2.1%",
    balance: "0.54",
  },
  {
    token: "NEAR",
    icon: NearIcon,
    apr: "6.8%",
    balance: "4,200",
  },
]

export default function EarnPage() {
  return (
    <>
      <EarnPromo />

      <section className="mt-9 flex justify-between pointer-events-none select-none opacity-50">
        <div>
          <h2 className="text-base text-fg-secondary font-medium">
            Earning balance
          </h2>
          <FormattedCurrency
            value={1239.23}
            formatOptions={{ currency: "USD" }}
            className="mt-1 font-bold text-4xl tracking-tight text-fg"
            centsClassName="text-2xl"
          />
        </div>
        <div>
          <h2 className="text-base text-fg-secondary font-medium text-right">
            Average APR
          </h2>
          <div className="mt-1 font-bold text-4xl tracking-tight text-fg text-right">
            8.2%
          </div>
        </div>
      </section>

      <section className="relative mt-9 pointer-events-none select-none opacity-50 flex flex-col gap-1">
        {PLACEHOLDER_VAULTS.map(({ token, icon: Icon, apr, balance }) => (
          <ListItem key={token}>
            <div className="rounded-full overflow-hidden size-10 shrink-0 outline-1 -outline-offset-1 outline-fg/10">
              <Icon className="size-full" />
            </div>
            <ListItem.Content>
              <ListItem.Title>{token}</ListItem.Title>
              <ListItem.Subtitle>
                Balance: {balance} {token}
              </ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Content align="end">
              <ListItem.Title>
                {apr} <span className="text-fg-secondary">APR</span>
              </ListItem.Title>
            </ListItem.Content>
          </ListItem>
        ))}
      </section>
    </>
  )
}
