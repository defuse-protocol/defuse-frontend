"use client"

import { FormattedCurrency } from "@src/components/DefuseSDK/features/account/components/shared/FormattedCurrency"
import ListItem from "@src/components/ListItem"
import { BtcIcon, EthIcon, NearIcon, UsdcIcon } from "@src/icons"
import clsx from "clsx"

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
      <div className="relative bg-gray-800 rounded-3xl grid grid-cols-3 gap-4 group overflow-hidden">
        <div className="col-span-2 relative p-5 z-20">
          <div className="bg-brand/20 text-brand text-xs rounded-lg px-2 py-1 inline-block uppercase font-bold">
            Coming soon
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-6">
            Earn
          </h1>
          <p className="text-gray-400 text-sm text-balance font-medium">
            Put your idle assets to work. No lockups. Withdraw anytime.
          </p>
        </div>

        <div className="relative" aria-hidden="true">
          <div className="absolute size-32 -bottom-16 -right-16 rounded-full bg-brand/80 blur-[75px] pointer-events-none" />

          {PLACEHOLDER_VAULTS.map(({ token, icon: Icon, apr }, index) => (
            <div
              key={token}
              className={clsx(
                "absolute flex items-center gap-1 bg-white p-0.5 pr-2 rounded-full w-fit",
                {
                  "top-6 -left-8": index === 0,
                  "top-12 right-7": index === 1,
                  "bottom-14 -left-6": index === 2,
                  "bottom-6 right-10": index === 3,
                }
              )}
            >
              <div className="rounded-full overflow-hidden size-5 shrink-0">
                <Icon className="size-full" />
              </div>
              <div className="text-xs text-gray-700 font-bold">{apr}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-9 flex justify-between pointer-events-none select-none opacity-50">
        <div>
          <h2 className="text-base text-gray-500 font-medium">
            Earning balance
          </h2>
          <FormattedCurrency
            value={1239.23}
            formatOptions={{ currency: "USD" }}
            className="mt-1 font-bold text-4xl tracking-tight text-gray-900"
            centsClassName="text-2xl"
          />
        </div>
        <div>
          <h2 className="text-base text-gray-500 font-medium text-right">
            Average APR
          </h2>
          <div className="mt-1 font-bold text-4xl tracking-tight text-gray-900 text-right">
            8.2%
          </div>
        </div>
      </section>

      <section className="relative mt-9 pointer-events-none select-none opacity-50 flex flex-col gap-1">
        {PLACEHOLDER_VAULTS.map(({ token, icon: Icon, apr, balance }) => (
          <ListItem key={token}>
            <div className="rounded-full overflow-hidden size-10 shrink-0 outline-1 -outline-offset-1 outline-gray-900/10">
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
                {apr} <span className="text-gray-500">APR</span>
              </ListItem.Title>
            </ListItem.Content>
          </ListItem>
        ))}
      </section>
    </>
  )
}
