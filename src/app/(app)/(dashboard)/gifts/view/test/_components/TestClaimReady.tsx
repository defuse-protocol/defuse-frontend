"use client"

import { GiftIcon } from "@phosphor-icons/react"
import Button from "@src/components/Button"
import {
  GiftRevealCard,
  clearGiftRevealState,
} from "@src/components/DefuseSDK/features/gift/components/GiftRevealCard"
import { GiftStrip } from "@src/components/DefuseSDK/features/gift/components/GiftStrip"
import { GiftDescription } from "@src/components/DefuseSDK/features/gift/components/shared/GiftDescription"
import { GiftHeader } from "@src/components/DefuseSDK/features/gift/components/shared/GiftHeader"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { useState } from "react"

export function TestClaimReady({
  token,
  giftId,
  onClaim,
}: {
  token?: TokenInfo
  giftId: string
  onClaim?: () => void
}) {
  const [processing, setProcessing] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [isHiding, setIsHiding] = useState(false)
  const mockAmount = { amount: 1000000000000000000n, decimals: 18 }

  const handleClaim = () => {
    setProcessing(true)
    setTimeout(() => {
      onClaim?.()
    }, 1500)
  }

  const handleIconClick = () => {
    if (isHiding) return
    setIsHiding(true)
    setTimeout(() => {
      clearGiftRevealState(giftId, "session")
      setResetKey((k) => k + 1)
      setIsHiding(false)
    }, 400)
  }

  const claimContent = (
    <div
      className="flex flex-col transition-all duration-400 ease-out"
      style={{
        transform: isHiding ? "rotateY(90deg) scale(0.95)" : "rotateY(0deg)",
        opacity: isHiding ? 0 : 1,
        transformStyle: "preserve-3d",
      }}
    >
      <GiftHeader
        title="You've received a gift!"
        icon={
          <button
            type="button"
            onClick={handleIconClick}
            className="size-16 rounded-full bg-emerald-100 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-emerald-200"
          >
            <GiftIcon weight="fill" className="size-8 text-emerald-600" />
          </button>
        }
      >
        <GiftDescription description="Sign in to claim it, no hidden fees or strings attached." />
      </GiftHeader>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          {token && (
            <GiftStrip
              token={token}
              amountSlot={
                <GiftStrip.Amount
                  token={token}
                  amount={mockAmount}
                  className="text-xl font-bold text-gray-900"
                />
              }
            />
          )}
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatTokenValue(mockAmount.amount, mockAmount.decimals, {
                fractionDigits: 6,
              })}
            </div>
            <div className="text-sm text-gray-500">
              {token?.symbol ?? "ETH"}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Message</div>
          <div className="text-base text-gray-900 font-medium">
            "Happy birthday! Enjoy your crypto gift!"
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Button
          onClick={handleClaim}
          type="button"
          size="xl"
          variant="primary"
          fullWidth
          loading={processing}
          disabled={processing}
        >
          {processing ? "Claiming..." : "Claim gift"}
        </Button>
      </div>
    </div>
  )

  return (
    <div style={{ perspective: "1000px" }}>
      <GiftRevealCard
        key={resetKey}
        giftId={giftId}
        storageType="session"
        onReveal={() => {}}
      >
        {claimContent}
      </GiftRevealCard>
    </div>
  )
}
