import { solverRelay } from "@defuse-protocol/internal-utils"
import { ArrowLongRightIcon } from "@heroicons/react/16/solid"
import { CheckIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { CopyButton } from "@src/components/DefuseSDK/components/IntentCard/CopyButton"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import ListItem from "@src/components/ListItem"
import Spinner from "@src/components/Spinner"
import { useQuery } from "@tanstack/react-query"
import clsx from "clsx"
import type { TokenInfo } from "../../../types/base"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { assert } from "../../../utils/assert"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
  negateTokenValue,
} from "../../../utils/tokenUtils"
import { midTruncate } from "../../withdraw/components/WithdrawForm/utils"
import type { TradeTerms } from "../utils/deriveTradeTerms"

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

  const { data, isPending } = useQuery({
    queryKey: ["intents_status", intentHashes],
    queryFn: async ({ signal }) => {
      const intentHash = intentHashes[0]
      assert(intentHash != null)
      return solverRelay.waitForIntentSettlement({ signal, intentHash })
    },
  })

  const txUrl =
    data?.txHash != null ? `${NEAR_EXPLORER}/txns/${data.txHash}` : null

  return (
    <div className="relative bg-white rounded-3xl p-6 border border-gray-200 overflow-hidden">
      <div
        className={clsx(
          "absolute h-24 inset-x-0 top-0 bg-linear-to-b transition-colors duration-300 ease-in-out",
          isPending
            ? "from-transparent to-transparent"
            : "from-green-50/50 to-green-50/0"
        )}
      />

      <div className="relative flex flex-col items-center justify-center mt-7">
        <div
          className={clsx(
            "size-13 rounded-full flex justify-center items-center text-gray-500",
            isPending ? "bg-gray-100" : "bg-green-100"
          )}
        >
          {isPending ? (
            <Spinner />
          ) : (
            <CheckIcon className="size-6 text-green-600" />
          )}
        </div>

        <h2 className="mt-5 text-2xl/7 font-bold tracking-tight text-center">
          {isPending ? "Almost there..." : "All done!"}
        </h2>
        <p className="mt-2 text-base/5 font-medium text-gray-500 text-center text-balance">
          {isPending
            ? "The trade is being processed. You will receive your funds shortly."
            : "The transaction has been successfully executed. The funds are now available in your account."}
        </p>
      </div>

      <ListItem className="mt-5">
        <div className="flex items-center">
          <AssetComboIcon {...tokenIn} />
          <AssetComboIcon
            {...tokenOut}
            className="-ml-4 ring-3 ring-white rounded-full"
          />
        </div>
        <ListItem.Content>
          <ListItem.Title className="flex items-center gap-0.5">
            {tokenIn.symbol}
            <ArrowLongRightIcon className="size-4 text-gray-400 shrink-0" />
            {tokenOut.symbol}
          </ListItem.Title>
        </ListItem.Content>
        <ListItem.Content align="end">
          <ListItem.Title>
            {formatTokenValue(
              breakdown.takerReceives.amount,
              breakdown.takerReceives.decimals
            )}{" "}
            {tokenOut.symbol}
          </ListItem.Title>
          <ListItem.Subtitle>
            {formatTokenValue(
              breakdown.takerSends.amount,
              breakdown.takerSends.decimals
            )}{" "}
            {tokenIn.symbol}
          </ListItem.Subtitle>
        </ListItem.Content>
      </ListItem>

      <dl className="mt-5 pt-5 border-t border-gray-200 space-y-4">
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500 font-medium">Intents</dt>
          <dd className="flex flex-col items-end gap-1">
            {intentHashes.map((intentHash) => (
              <div key={intentHash} className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {midTruncate(intentHash)}
                </span>
                <CopyButton text={intentHash} ariaLabel="Copy intent hash" />
              </div>
            ))}
          </dd>
        </div>

        {txUrl != null && (
          <div className="flex items-center justify-between">
            <dt className="text-sm text-gray-500 font-medium">
              Transaction hash
            </dt>
            <dd className="">
              {data?.txHash && (
                <div className="flex flex-row items-center gap-1 text-blue-c11 font-medium">
                  <a
                    href={txUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="text-sm font-semibold text-gray-900 hover:underline"
                  >
                    {midTruncate(data.txHash)}
                  </a>
                  <CopyButton text={data.txHash} ariaLabel="Copy intent hash" />
                </div>
              )}
            </dd>
          </div>
        )}
      </dl>

      {!isPending && (
        <div className="mt-5">
          {renderHostAppLink(
            "account",
            <Button size="xl" variant="secondary" fullWidth>
              Go to account
            </Button>,
            {}
          )}
        </div>
      )}
    </div>
  )
}
