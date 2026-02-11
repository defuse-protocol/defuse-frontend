import { solverRelay } from "@defuse-protocol/internal-utils"
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
} from "@src/components/DefuseSDK/utils/tokenUtils"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { CopyButton } from "../../../components/IntentCard/CopyButton"
import { assert } from "../../../utils/assert"
import { formatTokenValue } from "../../../utils/format"
import { midTruncate } from "../../withdraw/components/WithdrawForm/utils"
import type { GiftInfo } from "../actors/shared/getGiftInfo"
import { useTokenConfetti } from "./TokenConfetti"

const NEAR_EXPLORER = "https://nearblocks.io"

export function GiftTakerSuccessScreen({
  giftInfo,
  intentHashes,
}: {
  giftInfo: GiftInfo
  intentHashes: string[]
}) {
  const { fireOnce, stopAnimation } = useTokenConfetti()

  useEffect(() => {
    fireOnce()
    return stopAnimation
  }, [fireOnce, stopAnimation])

  const amount = computeTotalBalanceDifferentDecimals(
    getUnderlyingBaseTokenInfos(giftInfo.token),
    giftInfo.tokenDiff,
    { strict: false }
  )

  assert(amount != null)

  const intentStatus = useQuery({
    queryKey: ["intents_status", intentHashes],
    queryFn: async ({ signal }) => {
      const intentHash = intentHashes[0]
      assert(intentHash != null)
      return solverRelay.waitForIntentSettlement({ signal, intentHash })
    },
  })

  const txUrl =
    intentStatus.data?.txHash != null
      ? `${NEAR_EXPLORER}/txns/${intentStatus.data.txHash}`
      : null

  return (
    <>
      <h1 className="text-2xl/7 md:text-4xl/10 text-balance font-bold tracking-tight">
        Gift claimed!
      </h1>

      <p className="mt-4 text-gray-500 text-base font-medium">
        The funds are now in your account. Use them for trading or withdraw to
        your wallet.
      </p>

      <dl className="w-full space-y-3 mt-8 pt-8 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <dt className="text-sm font-medium text-gray-500">Amount</dt>
          <dd className="text-gray-900 font-semibold text-sm flex items-center gap-1">
            {formatTokenValue(amount.amount, amount.decimals, {
              fractionDigits: 6,
            })}{" "}
            {giftInfo.token.symbol}
            <AssetComboIcon {...giftInfo.token} sizeClassName="size-4" />
          </dd>
        </div>

        <div className="flex justify-between items-center">
          <dt className="text-sm font-medium text-gray-500">Intent</dt>
          <dd className="text-gray-900 font-semibold text-sm flex items-center gap-1">
            {midTruncate(intentHashes[0])}
            <CopyButton text={intentHashes[0]} ariaLabel="Copy intent hash" />
          </dd>
        </div>

        {txUrl != null && (
          <div className="flex justify-between items-center">
            <dt className="text-sm font-medium text-gray-500">Transaction</dt>
            <dd className="text-gray-900 font-semibold text-sm">
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline group"
              >
                {midTruncate(intentStatus.data?.txHash ?? "")}
                <ArrowTopRightOnSquareIcon className="size-4 text-gray-400 group-hover:text-gray-700" />
              </a>
            </dd>
          </div>
        )}
      </dl>

      <Button
        href="/account"
        type="button"
        size="xl"
        variant="primary"
        fullWidth
        className="mt-10"
      >
        Go to account
      </Button>
    </>
  )
}
