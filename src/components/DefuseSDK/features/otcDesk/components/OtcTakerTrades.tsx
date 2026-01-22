import type { MultiPayload } from "@defuse-protocol/contract-types"
import { solverRelay } from "@defuse-protocol/internal-utils"
import { ArrowLongRightIcon } from "@heroicons/react/16/solid"
import { CheckIcon } from "@heroicons/react/20/solid"
import ListItem from "@src/components/ListItem"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import AssetComboIcon from "../../../components/Asset/AssetComboIcon"
import { CopyButton } from "../../../components/IntentCard/CopyButton"
import { BaseModalDialog } from "../../../components/Modal/ModalDialog"
import type { TokenInfo } from "../../../types/base"
import { assert } from "../../../utils/assert"
import { formatTokenValue } from "../../../utils/format"
import {
  computeTotalBalanceDifferentDecimals,
  negateTokenValue,
} from "../../../utils/tokenUtils"
import { midTruncate } from "../../withdraw/components/WithdrawForm/utils"
import { useOtcTakerTrades } from "../stores/otcTakerTrades"
import {
  type DetermineInvolvedTokensErr,
  determineInvolvedTokens,
} from "../utils/deriveTradeTerms"
import {
  type ParseTradeTermsErr,
  parseTradeTerms,
} from "../utils/parseTradeTerms"

const NEAR_EXPLORER = "https://nearblocks.io"

interface OtcTakerTradesProps {
  tokenList: TokenInfo[]
}

type TakerTradeSelection = {
  tradeId: string
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  amountIn: { amount: bigint; decimals: number }
  amountOut: { amount: bigint; decimals: number }
  intentHashes: string[]
} | null

function isCompletedTrade(trade: unknown): trade is {
  tradeId: string
  status: "completed"
  makerMultiPayload: MultiPayload
  takerMultiPayload: MultiPayload
  intentHashes: string[]
} {
  return (
    trade != null &&
    typeof trade === "object" &&
    "status" in trade &&
    trade.status === "completed" &&
    "takerMultiPayload" in trade &&
    "intentHashes" in trade &&
    Array.isArray((trade as { intentHashes: unknown }).intentHashes)
  )
}

export function OtcTakerTrades({ tokenList }: OtcTakerTradesProps) {
  const [selectedTrade, setSelectedTrade] = useState<TakerTradeSelection>(null)

  const trades = useOtcTakerTrades((s) => {
    return Object.values(s.trades).filter(isCompletedTrade)
  })

  if (trades.length === 0) {
    return null
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Trades taken
      </h3>
      <div className="flex flex-col gap-1">
        {trades.map((trade) => (
          <OtcTakerTradeItem
            key={trade.tradeId}
            tradeId={trade.tradeId}
            makerMultiPayload={trade.makerMultiPayload}
            takerMultiPayload={trade.takerMultiPayload}
            intentHashes={trade.intentHashes}
            tokenList={tokenList}
            onSelect={(tradeData) => setSelectedTrade(tradeData)}
          />
        ))}
      </div>

      {selectedTrade != null && (
        <ModalTakerTradeDetails
          open={true}
          onClose={() => setSelectedTrade(null)}
          tokenIn={selectedTrade.tokenIn}
          tokenOut={selectedTrade.tokenOut}
          amountIn={selectedTrade.amountIn}
          amountOut={selectedTrade.amountOut}
          tradeId={selectedTrade.tradeId}
          intentHashes={selectedTrade.intentHashes}
        />
      )}
    </div>
  )
}

interface OtcTakerTradeItemProps {
  tradeId: string
  makerMultiPayload: MultiPayload
  takerMultiPayload: MultiPayload
  intentHashes: string[]
  tokenList: TokenInfo[]
  onSelect: (trade: TakerTradeSelection) => void
}

function OtcTakerTradeItem({
  tradeId,
  takerMultiPayload,
  intentHashes,
  tokenList,
  onSelect,
}: OtcTakerTradeItemProps) {
  const tradeTermsResult = parseTradeTerms(takerMultiPayload)
    .mapErr<ParseTradeTermsErr | DetermineInvolvedTokensErr>((a) => a)
    .andThen((tradeTerms) =>
      determineInvolvedTokens(tokenList, tradeTerms.tokenDiff).map(
        ({ tokenIn, tokenOut }) => ({
          tradeTerms: tradeTerms,
          tokenIn: tokenIn,
          tokenOut: tokenOut,
        })
      )
    )

  if (tradeTermsResult.isErr()) {
    return <div>Error: {tradeTermsResult.unwrapErr()}</div>
  }

  const { tradeTerms, tokenIn, tokenOut } = tradeTermsResult.unwrap()

  const totalAmountIn = computeTotalBalanceDifferentDecimals(
    tokenIn,
    tradeTerms.tokenDiff,
    { strict: false }
  )
  assert(totalAmountIn)

  const totalAmountOut = computeTotalBalanceDifferentDecimals(
    tokenOut,
    tradeTerms.tokenDiff,
    { strict: false }
  )
  assert(totalAmountOut)

  const handleClick = () => {
    onSelect({
      tradeId,
      tokenIn,
      tokenOut,
      amountIn: negateTokenValue(totalAmountIn),
      amountOut: totalAmountOut,
      intentHashes,
    })
  }

  return (
    <ListItem onClick={handleClick} dataTestId="otc-taker-trade-item">
      <AssetComboIcon {...tokenOut} badgeType="success" />
      <ListItem.Content>
        <ListItem.Title className="flex items-center gap-0.5">
          {tokenIn.symbol}
          <ArrowLongRightIcon className="size-4 text-gray-400 shrink-0" />
          {tokenOut.symbol}
        </ListItem.Title>
        <ListItem.Subtitle className="text-green-600">
          Completed
        </ListItem.Subtitle>
      </ListItem.Content>
      <ListItem.Content align="end">
        <ListItem.Title>
          {formatTokenValue(totalAmountOut.amount, totalAmountOut.decimals, {
            fractionDigits: 4,
          })}{" "}
          {tokenOut.symbol}
        </ListItem.Title>
        <ListItem.Subtitle>
          {formatTokenValue(-totalAmountIn.amount, totalAmountIn.decimals, {
            fractionDigits: 4,
          })}{" "}
          {tokenIn.symbol}
        </ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  )
}

interface ModalTakerTradeDetailsProps {
  open: boolean
  onClose: () => void
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  amountIn: { amount: bigint; decimals: number }
  amountOut: { amount: bigint; decimals: number }
  tradeId: string
  intentHashes: string[]
}

function ModalTakerTradeDetails({
  open,
  onClose,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  tradeId,
  intentHashes,
}: ModalTakerTradeDetailsProps) {
  const { data, isPending } = useQuery({
    queryKey: ["taker_intent_status", intentHashes],
    queryFn: async ({ signal }) => {
      const intentHash = intentHashes[0]
      if (!intentHash) return null
      return solverRelay.waitForIntentSettlement({ signal, intentHash })
    },
    enabled: intentHashes.length > 0,
  })

  const txUrl =
    data?.txHash != null ? `${NEAR_EXPLORER}/txns/${data.txHash}` : null

  return (
    <BaseModalDialog open={open} onClose={onClose} title="">
      <div className="flex flex-col items-center justify-center">
        <div className="size-13 rounded-full bg-green-100 flex justify-center items-center">
          <CheckIcon className="size-6 text-green-600" />
        </div>

        <h2 className="mt-5 text-2xl/7 font-bold tracking-tight text-center">
          Trade completed
        </h2>
        <p className="mt-2 text-base/5 font-medium text-gray-500 text-center text-balance">
          This trade was successfully executed.
        </p>
      </div>

      <dl className="mt-7 pt-5 border-t border-gray-200 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-sm/5 text-gray-500 font-medium">You sent</dt>
          <dd className="flex items-center gap-1 justify-end">
            <span className="text-sm/5 text-gray-900 font-semibold">
              {formatTokenValue(amountIn.amount, amountIn.decimals, {
                fractionDigits: 4,
              })}{" "}
              {tokenIn.symbol}
            </span>
            <AssetComboIcon {...tokenIn} sizeClassName="size-4" />
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-sm/5 text-gray-500 font-medium">You received</dt>
          <dd className="flex items-center gap-1 justify-end">
            <span className="text-sm/5 text-gray-900 font-semibold">
              {formatTokenValue(amountOut.amount, amountOut.decimals, {
                fractionDigits: 4,
              })}{" "}
              {tokenOut.symbol}
            </span>
            <AssetComboIcon {...tokenOut} sizeClassName="size-4" />
          </dd>
        </div>
      </dl>

      <dl className="mt-5 pt-5 border-t border-gray-200 space-y-4">
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500 font-medium">Trade ID</dt>
          <dd className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {midTruncate(tradeId, 16)}
            </span>
            <CopyButton text={tradeId} ariaLabel="Copy trade ID" />
          </dd>
        </div>

        {intentHashes.length > 0 && (
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500 font-medium">Intent</dt>
            <dd className="flex flex-col items-end gap-1">
              {intentHashes.map((intentHash) => (
                <div key={intentHash} className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {midTruncate(intentHash, 16)}
                  </span>
                  <CopyButton text={intentHash} ariaLabel="Copy intent hash" />
                </div>
              ))}
            </dd>
          </div>
        )}

        {isPending && (
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500 font-medium">
              Transaction hash
            </dt>
            <dd className="text-sm text-gray-400">Loading...</dd>
          </div>
        )}

        {txUrl != null && data?.txHash && (
          <div className="flex items-center justify-between">
            <dt className="text-sm text-gray-500 font-medium">
              Transaction hash
            </dt>
            <dd className="flex items-center gap-2">
              <a
                href={txUrl}
                rel="noopener noreferrer"
                target="_blank"
                className="text-sm font-semibold text-gray-900 hover:underline"
              >
                {midTruncate(data.txHash, 16)}
              </a>
              <CopyButton
                text={data.txHash}
                ariaLabel="Copy transaction hash"
              />
            </dd>
          </div>
        )}
      </dl>
    </BaseModalDialog>
  )
}
