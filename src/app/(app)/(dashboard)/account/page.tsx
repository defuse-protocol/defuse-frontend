"use client"

import { authIdentity } from "@defuse-protocol/internal-utils"
import { ShieldCheckIcon } from "@heroicons/react/24/outline"
import { CheckIcon } from "@heroicons/react/24/solid"
import Button from "@src/components/Button"
import Assets from "@src/components/DefuseSDK/features/account/components/Assets"
import Balance from "@src/components/DefuseSDK/features/account/components/Balance"
import { useWatchHoldings } from "@src/components/DefuseSDK/features/account/hooks/useWatchHoldings"
import { computeTotalUsdValue } from "@src/components/DefuseSDK/features/account/utils/holdingsUtils"
import { getDefuseAssetId } from "@src/components/DefuseSDK/utils/token"
import ListItem from "@src/components/ListItem"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { DepositIcon, SendIcon, SwapIcon } from "@src/icons"
import clsx from "clsx"
import { useMemo, useState } from "react"

type AccountType = "main" | "shielded"

export default function AccountPage() {
  const [accountType, setAccountType] = useState<AccountType>("main")
  const { state } = useConnectWallet()
  let tokenList = useTokenList(LIST_TOKENS)

  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType ?? null

  const userId =
    userAddress != null && userChainType != null
      ? authIdentity.authHandleToIntentsUserId(userAddress, userChainType)
      : null

  tokenList = useMemo(() => {
    const map = new Map()
    for (const t of tokenList) {
      if (!map.has(getDefuseAssetId(t))) {
        map.set(getDefuseAssetId(t), t)
      }
    }
    return Array.from(map.values())
  }, [tokenList])

  const {
    data: holdings,
    isPending,
    isError,
  } = useWatchHoldings({ userId, tokenList })
  const totalValueUsd = holdings ? computeTotalUsdValue(holdings) : undefined

  const assetsLoaded = !isPending && !isError && Boolean(holdings)
  const noAssets = assetsLoaded && holdings && holdings.length === 0

  return (
    <>
      <h1 className="sr-only">Account</h1>

      {/* Account Type Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setAccountType("main")}
          className={clsx(
            "relative rounded-2xl px-4 py-3 text-left transition-all flex items-center gap-2",
            accountType === "main"
              ? "bg-white ring-2 ring-gray-900"
              : "bg-gray-100 hover:bg-gray-200"
          )}
        >
          <span className="text-sm font-semibold text-gray-900">
            Main Account
          </span>
          {accountType === "main" && (
            <CheckIcon className="size-4 text-gray-900" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setAccountType("shielded")}
          className={clsx(
            "relative rounded-2xl px-4 py-3 text-left transition-all flex items-center gap-2",
            accountType === "shielded"
              ? "bg-white ring-2 ring-gray-900"
              : "bg-gray-100 hover:bg-gray-200"
          )}
        >
          <ShieldCheckIcon className="size-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">
            Shielded Account
          </span>
          {accountType === "shielded" && (
            <CheckIcon className="size-4 text-gray-900" />
          )}
        </button>
      </div>

      {accountType === "main" ? (
        <div className="mt-6">
          <Balance balance={totalValueUsd} />

          {!noAssets && (
            <section className="grid grid-cols-2 gap-2 mt-6">
              <Button href="/deposit" size="xl">
                <DepositIcon className="size-6 -mt-1.5" />
                Add funds
              </Button>

              <Button href="/send" size="xl">
                <SendIcon className="size-6" />
                Send
              </Button>
            </section>
          )}

          <Assets assets={holdings} isPending={isPending} isError={isError} />
        </div>
      ) : (
        <ShieldedAccountPreview />
      )}
    </>
  )
}

const PLACEHOLDER_SHIELDED_ASSETS = [
  {
    icon: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
    name: "USD Coin",
    symbol: "USDC",
    value: "$5,230.00",
    amount: "5,230",
  },
  {
    icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    name: "Ethereum",
    symbol: "ETH",
    value: "$3,842.50",
    amount: "1.25",
  },
  {
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    name: "Bitcoin",
    symbol: "BTC",
    value: "$12,450.00",
    amount: "0.15",
  },
  {
    icon: "https://assets.coingecko.com/coins/images/10365/large/near.jpg",
    name: "NEAR Protocol",
    symbol: "NEAR",
    value: "$890.40",
    amount: "420",
  },
  {
    icon: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    name: "Solana",
    symbol: "SOL",
    value: "$1,560.00",
    amount: "12",
  },
  {
    icon: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
    name: "Tether",
    symbol: "USDT",
    value: "$2,100.00",
    amount: "2,100",
  },
]

// Calculate total value from placeholder assets
const SHIELDED_TOTAL_VALUE = PLACEHOLDER_SHIELDED_ASSETS.reduce(
  (sum, asset) => {
    const value = Number.parseFloat(asset.value.replace(/[$,]/g, ""))
    return sum + value
  },
  0
)

function ShieldedAccountPreview() {
  return (
    <div className="mt-6">
      {/* Coming Soon Banner */}
      <div className="text-center py-6 px-4 bg-[linear-gradient(180deg,#191918_0%,#52471E_100%)] rounded-2xl">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheckIcon className="size-6 text-brand" />
          <h2 className="text-xl font-bold text-white">Coming Soon</h2>
        </div>
        <p className="text-gray-400 text-sm">
          Your private vault. Deposit, swap, and transfer—visible only to you.
        </p>
      </div>

      {/* Shielded Balance */}
      <section className="mt-6">
        <h2 className="text-base text-gray-500 font-medium">
          Shielded balance
        </h2>
        <p className="mt-2 font-bold text-5xl tracking-tight text-gray-900">
          $
          {
            SHIELDED_TOTAL_VALUE.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).split(".")[0]
          }
          <span className="text-3xl">
            .
            {
              SHIELDED_TOTAL_VALUE.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).split(".")[1]
            }
          </span>
        </p>
      </section>

      {/* Shielded Action Buttons */}
      <section className="grid grid-cols-2 gap-2 mt-6">
        <Button
          size="xl"
          disabled
          className="disabled:bg-gray-200 disabled:text-gray-400"
        >
          <DepositIcon className="size-6 -mt-1.5" />
          Add funds
        </Button>

        <Button
          size="xl"
          disabled
          className="disabled:bg-gray-200 disabled:text-gray-400"
        >
          <SendIcon className="size-6" />
          Send
        </Button>
      </section>

      {/* Placeholder shielded assets */}
      <section className="mt-6">
        <h2 className="text-base text-gray-500 font-medium">Shielded Assets</h2>
        <div className="mt-2 flex flex-col gap-1">
          {PLACEHOLDER_SHIELDED_ASSETS.map((asset) => (
            <ListItem
              key={asset.symbol}
              popoverContent={
                <>
                  <Button size="sm">
                    <SendIcon className="size-4 shrink-0" />
                    Shielded Transfer
                  </Button>
                  <Button size="sm">
                    <SwapIcon className="size-4 shrink-0" />
                    Shielded Swap
                  </Button>
                </>
              }
            >
              <div className="size-10 rounded-full overflow-hidden bg-gray-100">
                <img
                  src={asset.icon}
                  alt=""
                  className="size-full object-contain"
                />
              </div>

              <ListItem.Content>
                <ListItem.Title>{asset.name}</ListItem.Title>
                <ListItem.Subtitle>{asset.symbol}</ListItem.Subtitle>
              </ListItem.Content>

              <ListItem.Content align="end">
                <ListItem.Title>{asset.value}</ListItem.Title>
                <ListItem.Subtitle>{asset.amount}</ListItem.Subtitle>
              </ListItem.Content>
            </ListItem>
          ))}
        </div>
      </section>
    </div>
  )
}
