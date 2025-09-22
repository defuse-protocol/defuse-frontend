import { solverRelay } from "@defuse-protocol/internal-utils"
import { CheckIcon } from "@phosphor-icons/react"
import { Button } from "@radix-ui/themes"
import { CopyButton } from "@src/components/DefuseSDK/components/IntentCard/CopyButton"
import { useQuery } from "@tanstack/react-query"
import type { TokenInfo } from "../../../types/base"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { assert } from "../../../utils/assert"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
  negateTokenValue,
} from "../../../utils/tokenUtils"
import type { TradeTerms } from "../utils/deriveTradeTerms"
import { SwapStrip } from "./shared/SwapStrip"

const NEAR_EXPLORER = "https://nearblocks.io"

export function OtcTakerSuccessScreen({
  tradeTerms,
  intentHashes,
  tokenIn,
  tokenOut,
  renderHostAppLink,
}: {
  tradeTerms: TradeTerms
  intentHashes: string[]
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  renderHostAppLink: RenderHostAppLink
}) {
  const amountIn = computeTotalBalanceDifferentDecimals(
    getUnderlyingBaseTokenInfos(tokenIn),
    tradeTerms.takerTokenDiff,
    { strict: false }
  )

  const amountOut = computeTotalBalanceDifferentDecimals(
    getUnderlyingBaseTokenInfos(tokenOut),
    tradeTerms.takerTokenDiff,
    { strict: false }
  )

  assert(amountIn != null && amountOut != null)

  const breakdown = {
    takerSends: negateTokenValue(amountIn),
    takerReceives: amountOut,
  }

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
    <div>
      {/* Header Section */}
      <div className="flex flex-row justify-between mb-5">
        <div className="flex flex-col items-start gap-1.5">
          <div className="text-2xl font-black text-gray-12 mb-2">
            {intentStatus.isPending ? "Almost there" : "All done!"}
          </div>
          {intentStatus.isPending ? (
            <div className="text-sm font-medium text-gray-11">
              Your swap is being processed. You will receive your funds shortly.
            </div>
          ) : (
            <div className="text-sm font-medium text-gray-11">
              Your swap has been successfully completed, and the funds are now
              available in your account.
            </div>
          )}
        </div>
        <div className="flex justify-center items-start">
          <div className="w-[64px] h-[64px] flex items-center justify-center rounded-full bg-green-4">
            <CheckIcon weight="bold" className="size-7 text-green-a11" />
          </div>
        </div>
      </div>

      {/* Order Section */}
      <SwapStrip
        tokenIn={tokenIn}
        tokenOut={tokenOut}
        amountIn={breakdown.takerSends}
        amountOut={breakdown.takerReceives}
      />

      <div className="flex flex-col gap-3.5 px-4 text-xs mt-4">
        <div className="flex justify-between items-center">
          <div className="text-gray-11 font-medium">Intents</div>
          <div className="flex gap-2.5">
            {intentHashes.map((intentHash) => (
              <div
                key={intentHash}
                className="flex flex-row items-center gap-1 text-gray-12 font-medium"
              >
                <span className="text-gray-12 font-medium">
                  {truncateHash(intentHash)}
                </span>
                <CopyButton text={intentHash} ariaLabel="Copy intent hash" />
              </div>
            ))}
          </div>
        </div>
        {txUrl != null && (
          <div className="flex justify-between items-center">
            <div className="text-gray-11 font-medium">Transaction hash</div>
            {intentStatus.data?.txHash && (
              <div className="flex flex-row items-center gap-1 text-blue-c11 font-medium">
                <a href={txUrl} rel="noopener noreferrer" target="_blank">
                  {truncateHash(intentStatus.data.txHash)}
                </a>
                <CopyButton
                  text={intentStatus.data.txHash}
                  ariaLabel="Copy intent hash"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center gap-3 mt-5">
        {renderHostAppLink(
          "account",
          <Button asChild size="4" className="w-full h-14 font-bold">
            <div>Go to account</div>
          </Button>,
          { className: "w-full" }
        )}
        {renderHostAppLink(
          "withdraw",
          <Button
            asChild
            size="4"
            className="w-full h-14 font-bold"
            variant="outline"
            color="gray"
          >
            <div>Withdraw</div>
          </Button>,
          { className: "w-full" }
        )}
      </div>
    </div>
  )
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 5)}...${hash.slice(-5)}`
}
