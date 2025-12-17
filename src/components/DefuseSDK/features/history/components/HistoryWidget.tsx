"use client"

import type { TokenInfo } from "../../../types/base"
import { HistoryIsland } from "./HistoryIsland"

interface HistoryWidgetProps {
  userAddress: string | null
  tokenList: TokenInfo[]
}

export function HistoryWidget({ userAddress, tokenList }: HistoryWidgetProps) {
  return (
    <div className="flex flex-col gap-5 widget-container">
      <HistoryIsland accountId={userAddress} tokenList={tokenList} />
    </div>
  )
}
