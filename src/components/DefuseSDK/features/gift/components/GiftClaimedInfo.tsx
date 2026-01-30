"use client"

import { ArrowSquareOutIcon, CheckCircleIcon } from "@phosphor-icons/react"
import type { TokenInfo } from "../../../types/base"
import { blockExplorerTxLinkFactory } from "../../../utils/chainTxExplorer"
import { formatTokenValue } from "../../../utils/format"
import { GiftStrip } from "./GiftStrip"
import { GiftDescription } from "./shared/GiftDescription"
import { GiftHeader } from "./shared/GiftHeader"

type GiftClaimedInfoProps = {
  token: TokenInfo
  amount: {
    amount: bigint
    decimals: number
  }
  intentId?: string
  txHash?: string
}

export function GiftClaimedInfo({
  token,
  amount,
  intentId = "abc12...xyz89",
  txHash = "def34...uvw67",
}: GiftClaimedInfoProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <GiftHeader
        title="Gift claimed!"
        icon={
          <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircleIcon
              weight="fill"
              className="size-10 text-emerald-600"
            />
          </div>
        }
      >
        <GiftDescription description="The funds are now in your account. Use them for trading or withdraw to your wallet." />
      </GiftHeader>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <GiftStrip
            token={token}
            amountSlot={
              <GiftStrip.Amount
                token={token}
                amount={amount}
                className="text-lg font-bold text-gray-900"
              />
            }
          />
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-600">
              +
              {formatTokenValue(amount.amount, amount.decimals, {
                fractionDigits: 6,
              })}
            </div>
            <div className="text-sm text-gray-500">{token.symbol}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Intent</span>
            <span className="font-mono text-gray-900">{intentId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Transaction</span>
            <a
              href={blockExplorerTxLinkFactory("near", txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center gap-1"
            >
              {txHash}
              <ArrowSquareOutIcon className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
