"use client"

import { ArrowSquareOutIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { GiftStrip } from "@src/components/DefuseSDK/features/gift/components/GiftStrip"
import { useTokenConfetti } from "@src/components/DefuseSDK/features/gift/components/TokenConfetti"
import { GiftDescription } from "@src/components/DefuseSDK/features/gift/components/shared/GiftDescription"
import { GiftHeader } from "@src/components/DefuseSDK/features/gift/components/shared/GiftHeader"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { useEffect } from "react"

export function TestSuccess({ token }: { token?: TokenInfo }) {
  const { fireOnce } = useTokenConfetti()
  const mockAmount = { amount: 1000000000000000000n, decimals: 18 }

  useEffect(() => {
    fireOnce()
  }, [fireOnce])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GiftHeader
        title="Gift claimed!"
        icon={
          <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in duration-300">
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
          {token && (
            <GiftStrip
              token={token}
              amountSlot={
                <GiftStrip.Amount
                  token={token}
                  amount={mockAmount}
                  className="text-lg font-bold text-gray-900"
                />
              }
            />
          )}
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-600">
              +
              {formatTokenValue(mockAmount.amount, mockAmount.decimals, {
                fractionDigits: 6,
              })}
            </div>
            <div className="text-sm text-gray-500">
              {token?.symbol ?? "ETH"}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Intent</span>
            <span className="font-mono text-gray-900">abc12...xyz89</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Transaction</span>
            <a
              href="https://nearblocks.io/txns/mock-tx-hash"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center gap-1"
            >
              def34...uvw67
              <ArrowSquareOutIcon className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
