"use client"

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { useTokenConfetti } from "@src/components/DefuseSDK/features/gift/components/TokenConfetti"
import { midTruncate } from "@src/components/DefuseSDK/features/withdraw/components/WithdrawForm/utils"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import PageHeader from "@src/components/PageHeader"
import { useEffect } from "react"

export function TestSuccess({ token }: { token?: TokenInfo }) {
  const { fireOnce } = useTokenConfetti()
  const mockAmount = { amount: 1000000000000000000n, decimals: 18 }

  useEffect(() => {
    fireOnce()
  }, [fireOnce])

  return (
    <>
      <PageHeader
        title="Gift claimed!"
        subtitle="The funds are now in your account. Use them for trading or withdraw to your wallet."
      />

      <div className="p-5 pt-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200 mt-7 gap-7">
        <div className="flex flex-col items-center gap-5">
          <AssetComboIcon {...token} sizeClassName="size-13" />
          <div className="text-2xl/7 font-bold text-gray-900 tracking-tight">
            {formatTokenValue(mockAmount.amount, mockAmount.decimals, {
              fractionDigits: 6,
            })}{" "}
            {token?.symbol ?? "ETH"}
          </div>
        </div>

        <dl className="w-full space-y-2 pt-5 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <dt className="text-sm font-medium text-gray-500">Intent</dt>
            <dd className="text-gray-900 font-semibold text-sm">
              {midTruncate("abc1281730193xyz89")}
            </dd>
          </div>

          <div className="flex justify-between items-center">
            <dt className="text-sm font-medium text-gray-500">Transaction</dt>
            <dd className="text-gray-900 font-semibold text-sm">
              <a
                href="https://nearblocks.io/txns/mock-tx-hash"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                {midTruncate("def3481730193uvw67")}
                <ArrowTopRightOnSquareIcon className="size-4" />
              </a>
            </dd>
          </div>
        </dl>

        <Button
          href="/account"
          type="button"
          size="xl"
          variant="primary"
          fullWidth
        >
          Go to account
        </Button>
      </div>
    </>
  )
}
