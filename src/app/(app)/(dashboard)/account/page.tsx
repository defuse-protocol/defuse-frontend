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
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { DepositIcon, SendIcon } from "@src/icons"
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
        <>
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
        </>
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
  },
  {
    icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    name: "Ethereum",
    symbol: "ETH",
  },
  {
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    name: "Bitcoin",
    symbol: "BTC",
  },
]

function ShieldedAssetIcon({ icon }: { icon: string }) {
  return (
    <div className="relative size-10 rounded-full overflow-hidden bg-gray-100">
      <img src={icon} alt="" className="size-full object-contain blur-[2px]" />
      {/* Privacy bar across the icon */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2.5 bg-gray-900/80" />
    </div>
  )
}

function ShieldedAccountPreview() {
  return (
    <>
      {/* Coming Soon Banner */}
      <div className="mt-6 text-center py-6 px-4 bg-gradient-to-b from-brand/10 to-white rounded-2xl border border-brand/20">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheckIcon className="size-6 text-brand" />
          <h2 className="text-xl font-bold text-gray-900">Coming Soon</h2>
        </div>
        <p className="text-gray-600 text-sm">
          Your private vault. Deposit, swap, and transfer—visible only to you.
        </p>
      </div>

      {/* Placeholder shielded assets */}
      <section className="mt-6">
        <h2 className="text-base text-gray-500 font-medium">Shielded Assets</h2>
        <div className="mt-2 flex flex-col gap-1 opacity-60 pointer-events-none select-none">
          {PLACEHOLDER_SHIELDED_ASSETS.map((asset) => (
            <div
              key={asset.symbol}
              className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100"
            >
              <ShieldedAssetIcon icon={asset.icon} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 blur-[3px]">
                  {asset.name}
                </div>
                <div className="text-sm text-gray-500">{asset.symbol}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900 blur-[4px]">
                  $••••.••
                </div>
                <div className="text-sm text-gray-500 blur-[3px]">••••</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
