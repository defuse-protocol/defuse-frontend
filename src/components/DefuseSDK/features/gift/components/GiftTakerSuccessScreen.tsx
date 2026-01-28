import { solverRelay } from "@defuse-protocol/internal-utils"
import { ArrowSquareOutIcon, CheckCircleIcon } from "@phosphor-icons/react"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
} from "@src/components/DefuseSDK/utils/tokenUtils"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { CopyButton } from "../../../components/IntentCard/CopyButton"
import { assert } from "../../../utils/assert"
import { formatTokenValue } from "../../../utils/format"
import type { GiftInfo } from "../actors/shared/getGiftInfo"
import { GiftStrip } from "./GiftStrip"
import { useTokenConfetti } from "./TokenConfetti"
import { GiftDescription } from "./shared/GiftDescription"
import { GiftHeader } from "./shared/GiftHeader"

const NEAR_EXPLORER = "https://nearblocks.io"

export function GiftTakerSuccessScreen({
  giftInfo,
  intentHashes,
}: {
  giftInfo: GiftInfo
  intentHashes: string[]
}) {
  const { fireOnce } = useTokenConfetti()

  useEffect(() => {
    fireOnce()
  }, [fireOnce])

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
          <GiftStrip
            token={giftInfo.token}
            amountSlot={
              <GiftStrip.Amount
                token={giftInfo.token}
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
            <div className="text-sm text-gray-500">{giftInfo.token.symbol}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Intent</span>
            <div className="flex items-center gap-1.5">
              {intentHashes.map((intentHash) => (
                <div
                  key={intentHash}
                  className="flex items-center gap-1 text-gray-900 font-medium"
                >
                  <span className="font-mono">{truncateHash(intentHash)}</span>
                  <CopyButton text={intentHash} ariaLabel="Copy intent hash" />
                </div>
              ))}
            </div>
          </div>
          {txUrl != null && intentStatus.data?.txHash && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Transaction</span>
              <div className="flex items-center gap-1.5">
                <a
                  href={txUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="font-mono text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center gap-1"
                >
                  {truncateHash(intentStatus.data.txHash)}
                  <ArrowSquareOutIcon className="size-3.5" />
                </a>
                <CopyButton
                  text={intentStatus.data.txHash}
                  ariaLabel="Copy transaction hash"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 5)}...${hash.slice(-5)}`
}
