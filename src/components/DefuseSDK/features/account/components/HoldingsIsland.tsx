import { Wallet } from "@phosphor-icons/react"
import { Island } from "../../../components/Island"
import { getTokenId } from "../../../utils/token"
import type { Holding } from "../types/sharedTypes"
import { HoldingItem, HoldingItemSkeleton } from "./shared/HoldingItem"

interface HoldingsIslandProps {
  isLoggedIn: boolean
  holdings: Holding[] | undefined
  hideBalances?: boolean
}

export function HoldingsIsland({
  isLoggedIn,
  holdings,
  hideBalances = false,
}: HoldingsIslandProps) {
  return (
    <Island className="py-4">
      <Content
        isLoggedIn={isLoggedIn}
        holdings={holdings}
        hideBalances={hideBalances}
      />
    </Island>
  )
}

function Content({
  isLoggedIn,
  holdings,
  hideBalances,
}: {
  isLoggedIn: boolean
  holdings: Holding[] | undefined
  hideBalances: boolean
}) {
  if (holdings?.length === 0 || !isLoggedIn) {
    return <EmptyScreen />
  }

  if (holdings == null) {
    return <LoadingScreen />
  }

  return holdings.map((holding) => (
    <HoldingItem
      key={getTokenId(holding.token)}
      holding={holding}
      hideBalances={hideBalances}
    />
  ))
}

function EmptyScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Wallet weight="bold" className="size-8 mb-2.5 text-gray-11" />
      <div className="text-sm font-bold mb-1">No assets here yet</div>
      <div className="text-xs font-medium text-gray-11">
        Deposit funds to start using NEAR Intents
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <>
      <HoldingItemSkeleton />
      <HoldingItemSkeleton />
      <HoldingItemSkeleton />
    </>
  )
}
