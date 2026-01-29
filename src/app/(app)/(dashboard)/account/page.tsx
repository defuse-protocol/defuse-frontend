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
import ListItemsSkeleton from "@src/components/ListItemsSkeleton"
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
            "relative rounded-2xl p-4 text-left transition-all",
            accountType === "main"
              ? "bg-white ring-2 ring-gray-900"
              : "bg-gray-100 hover:bg-gray-200"
          )}
        >
          {accountType === "main" && (
            <div className="absolute top-3 right-3 size-5 rounded-full bg-gray-900 flex items-center justify-center">
              <CheckIcon className="size-3 text-white" />
            </div>
          )}
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Main
          </div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            {totalValueUsd !== undefined
              ? `$${totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setAccountType("shielded")}
          className={clsx(
            "relative rounded-2xl p-4 text-left transition-all",
            accountType === "shielded"
              ? "bg-white ring-2 ring-gray-900"
              : "bg-gray-100 hover:bg-gray-200"
          )}
        >
          {accountType === "shielded" && (
            <div className="absolute top-3 right-3 size-5 rounded-full bg-gray-900 flex items-center justify-center">
              <CheckIcon className="size-3 text-white" />
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <ShieldCheckIcon className="size-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Shielded
            </span>
          </div>
          <div className="mt-1 text-lg font-bold text-gray-400">
            Coming Soon
          </div>
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

function ShieldedAccountPreview() {
  return (
    <>
      {/* Coming Soon Banner */}
      <div className="mt-6 text-center py-6 px-4 bg-gradient-to-b from-purple-50 to-white rounded-2xl border border-purple-100">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheckIcon className="size-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Coming Soon</h2>
        </div>
        <p className="text-gray-600 text-sm">
          Your private vault. Deposit, swap, and transfer—visible only to you.
        </p>
      </div>

      {/* Dimmed placeholder assets */}
      <section className="mt-6 relative">
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-25" />
        </div>
        <h2 className="text-base text-gray-500 font-medium opacity-50">
          Shielded Assets
        </h2>
        <div className="mt-2 opacity-40 pointer-events-none select-none">
          <ListItemsSkeleton count={3} />
        </div>
      </section>
    </>
  )
}
