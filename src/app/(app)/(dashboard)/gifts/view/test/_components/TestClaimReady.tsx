"use client"

import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import PageHeader from "@src/components/PageHeader"
import { useState } from "react"

export function TestClaimReady({
  token,
  onClaim,
}: {
  token?: TokenInfo
  giftId: string
  onClaim?: () => void
}) {
  const [processing, setProcessing] = useState(false)
  const mockAmount = { amount: 1000000000000000000n, decimals: 18 }

  const handleClaim = () => {
    setProcessing(true)
    setTimeout(() => {
      onClaim?.()
    }, 1500)
  }

  return (
    <>
      <PageHeader
        title="You've received a gift!"
        subtitle="Sign in to claim it, no hidden fees or strings attached."
      />

      <div className="p-5 pt-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200 mt-7 gap-7">
        <div className="flex flex-col items-center gap-5">
          <AssetComboIcon {...token} sizeClassName="size-13" />
          <h1 className="text-2xl/7 font-bold text-gray-900 tracking-tight">
            {formatTokenValue(mockAmount.amount, mockAmount.decimals, {
              fractionDigits: 6,
            })}{" "}
            {token?.symbol ?? "ETH"}
          </h1>
        </div>

        <div className="w-full border border-gray-200 rounded-3xl flex gap-3 p-3 items-center">
          <div className="bg-gray-100 rounded-full size-10 shrink-0 flex items-center justify-center">
            <ChatBubbleBottomCenterTextIcon className="size-5 text-gray-500" />
          </div>
          <div className="sr-only">Message</div>
          <div className="text-base font-semibold text-gray-600">
            Happy birthday! Enjoy your crypto gift!
          </div>
        </div>

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
    </>
  )
}
