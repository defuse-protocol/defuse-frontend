import type { MultiPayload } from "@defuse-protocol/contract-types"
import { authIdentity } from "@defuse-protocol/internal-utils"
import { Check as CheckIcon, Copy as CopyIcon } from "@phosphor-icons/react"
import { Button, IconButton } from "@radix-ui/themes"
import { nearClient } from "@src/components/DefuseSDK/constants/nearClient"
import { useQuery } from "@tanstack/react-query"
import { None, type Option, Some } from "@thames/monads"
import clsx from "clsx"
import { type ReactElement, useState } from "react"
import AssetComboIcon from "../../../components/Asset/AssetComboIcon"
import { Copy } from "../../../components/IntentCard/CopyButton"
import ModalActiveDeal from "../../../components/Modal/ModalActiveDeal"
import type { IntentsUserId, SignerCredentials } from "../../../core/formatters"
import { getDepositedBalances } from "../../../services/defuseBalanceService"
import { isNonceUsed } from "../../../services/intentsContractService"
import type { TokenInfo } from "../../../types/base"
import { assert } from "../../../utils/assert"
import { formatTokenValue } from "../../../utils/format"
import { computeTotalBalanceDifferentDecimals } from "../../../utils/tokenUtils"
import type { SendNearTransaction } from "../../machines/publicKeyVerifierMachine"
import { useCountdownTimer } from "../hooks/useCountdownTimer"
import {
  otcMakerTradesStore,
  useOtcMakerTrades,
} from "../stores/otcMakerTrades"
import type { GenerateLink, SignMessage } from "../types/sharedTypes"
import {
  type DetermineInvolvedTokensErr,
  determineInvolvedTokens,
} from "../utils/deriveTradeTerms"
import {
  type ParseTradeTermsErr,
  type TradeTerms,
  parseTradeTerms,
} from "../utils/parseTradeTerms"

interface OtcMakerTradesProps {
  tokenList: TokenInfo[]
  generateLink: GenerateLink
  signerCredentials: SignerCredentials
  signMessage: SignMessage
  sendNearTransaction: SendNearTransaction
}

type TradeSelection = {
  tradeId: string
  pKey: string
  iv: string
  multiPayload: MultiPayload
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  nonceBase64: string
}

type SelectedTrade = TradeSelection | null

export function OtcMakerTrades({
  tokenList,
  generateLink,
  signerCredentials,
  signMessage,
  sendNearTransaction,
}: OtcMakerTradesProps) {
  const [selectedTrade, setSelectedTrade] = useState<SelectedTrade>(null)

  const trades = useOtcMakerTrades((s) => {
    const userId = authIdentity.authHandleToIntentsUserId(
      signerCredentials.credential,
      signerCredentials.credentialType
    )
    return s.trades[userId]
  })

  if (trades == null || trades.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 px-5 pb-5">
      <div className="font-bold text-label text-sm">Pending orders</div>

      <div className="flex flex-col gap-2.5">
        {trades.map((trade) => (
          <OtcMakerTradeItem
            key={trade.tradeId}
            tradeId={trade.tradeId}
            pKey={trade.pKey}
            iv={trade.iv}
            multiPayload={trade.makerMultiPayload}
            updatedAt={trade.updatedAt}
            tokenList={tokenList}
            generateLink={generateLink}
            signerCredentials={signerCredentials}
            onSelect={(tradeData) => setSelectedTrade(tradeData)}
          />
        ))}
      </div>

      {selectedTrade != null && (
        <ModalActiveDeal
          open={true}
          onClose={() => setSelectedTrade(null)}
          tokenIn={selectedTrade.tokenIn}
          tokenOut={selectedTrade.tokenOut}
          tradeId={selectedTrade.tradeId}
          pKey={selectedTrade.pKey}
          iv={selectedTrade.iv}
          multiPayload={selectedTrade.multiPayload}
          nonceBase64={selectedTrade.nonceBase64}
          generateLink={generateLink}
          signerCredentials={signerCredentials}
          signMessage={signMessage}
          sendNearTransaction={sendNearTransaction}
        />
      )}
    </div>
  )
}

interface OtcMakerTradeItemProps {
  tradeId: string
  pKey: string
  iv: string
  multiPayload: MultiPayload
  updatedAt: number
  tokenList: TokenInfo[]
  generateLink: GenerateLink
  signerCredentials: SignerCredentials
  onSelect: (trade: SelectedTrade) => void
}

function OtcMakerTradeItem({
  tradeId,
  pKey,
  iv,
  multiPayload,
  tokenList,
  generateLink,
  signerCredentials,
  onSelect,
}: OtcMakerTradeItemProps) {
  const tradeTermsResult = parseTradeTerms(multiPayload)
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

  const err = useValidateTrade(tradeTerms)
  const errIsCritical = err
    .map((e) => e === "MAKER_INSUFFICIENT_FUNDS")
    .unwrapOr(false)
  const errIsSoft = err
    .map((e) => e !== "MAKER_INSUFFICIENT_FUNDS")
    .unwrapOr(false)

  const timeLeft = useCountdownTimer({ deadline: tradeTerms.deadline })

  const handleClick = () => {
    if (err.isNone()) {
      onSelect({
        tradeId,
        pKey,
        iv,
        multiPayload,
        tokenIn,
        tokenOut,
        nonceBase64: tradeTerms.nonceBase64,
      })
    }
  }

  return (
    <div data-testid="otc-maker-trade-item">
      <div
        className={clsx(
          "px-4 py-2.5 gap-2.5 flex items-center",
          !errIsCritical ? "bg-gray-3" : "bg-red-3",
          err.isNone()
            ? "rounded-lg cursor-pointer hover:bg-gray-4 transition-colors"
            : "rounded-tl-lg rounded-tr-lg"
        )}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick()
          }
        }}
        role={err.isNone() ? "button" : undefined}
        tabIndex={err.isNone() ? 0 : undefined}
      >
        <div className="flex items-center">
          <AssetComboIcon
            {...tokenIn}
            style={{
              mask: "radial-gradient(18px at 34px 50%, transparent 99%, rgb(255, 255, 255) 100%)",
            }}
          />
          <AssetComboIcon {...tokenOut} className="-ml-2.5" />
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <div className="font-bold text-label text-sm flex items-center gap-2">
            Swap
            <span className="text-xs font-medium text-gray-11">{timeLeft}</span>
          </div>
          <div className="font-medium text-xs text-gray-11">
            {formatTokenValue(-totalAmountIn.amount, totalAmountIn.decimals, {
              fractionDigits: 4,
            })}{" "}
            {tokenIn.symbol} →{" "}
            <span className="font-bold text-gray-12">
              {formatTokenValue(
                totalAmountOut.amount,
                totalAmountOut.decimals,
                { fractionDigits: 4 }
              )}{" "}
              {tokenOut.symbol}
            </span>
          </div>
        </div>

        <div
          className="flex gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {err.isNone() && (
            <Copy text={() => generateLink(tradeId, pKey, multiPayload, iv)}>
              {(copied) => (
                <IconButton
                  type="button"
                  variant="outline"
                  color="gray"
                  className="rounded-lg"
                >
                  {copied ? (
                    <CheckIcon weight="bold" />
                  ) : (
                    <CopyIcon weight="bold" />
                  )}
                </IconButton>
              )}
            </Copy>
          )}

          {errIsSoft && (
            <Button
              type="button"
              onClick={() => {
                otcMakerTradesStore
                  .getState()
                  .removeTrade(tradeId, signerCredentials)
              }}
              variant="outline"
              color="gray"
              size="1"
              className="rounded-lg"
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      {err
        .map((err): ReactElement | null => {
          return (
            // biome-ignore lint/correctness/useJsxKeyInIterable: it's not iterating over an array
            <div
              className={clsx(
                "rounded-br-lg rounded-bl-lg px-4 py-2 text-xs font-medium",
                !errIsCritical ? "bg-gray-6" : "bg-red-9 text-gray-1"
              )}
            >
              {err === "ORDER_EXPIRED" && <div>The order is expired</div>}

              {err === "NONCE_ALREADY_USED" && (
                <div>The order has been cancelled or already filled</div>
              )}

              {err === "MAKER_INSUFFICIENT_FUNDS" && (
                <div>
                  <span className="font-bold">The order cannot be filled.</span>{" "}
                  Your balance is incorrect. Please cancel the order and create
                  new another one.
                </div>
              )}
            </div>
          )
        })
        .unwrapOr(null)}
    </div>
  )
}

function useValidateTrade(tradeTerms: TradeTerms) {
  let error: Option<
    "ORDER_EXPIRED" | "NONCE_ALREADY_USED" | "MAKER_INSUFFICIENT_FUNDS"
  > = None

  if (new Date(tradeTerms.deadline) < new Date()) {
    error = Some("ORDER_EXPIRED")
  }

  const makerBalanceValidation = useQuery({
    enabled: error.isNone(),
    queryKey: [
      "deposited_balance",
      tradeTerms.userId,
      Object.keys(tradeTerms.tokenDiff),
    ],
    queryFn: () => {
      return getDepositedBalances(
        tradeTerms.userId as IntentsUserId,
        Object.keys(tradeTerms.tokenDiff),
        nearClient
      )
    },
    select: (makerTokenBalances): Option<"MAKER_INSUFFICIENT_FUNDS"> => {
      for (const [tokenId, amount] of Object.entries(tradeTerms.tokenDiff)) {
        if (amount >= 0) {
          continue
        }

        const balance = makerTokenBalances[tokenId]

        if (balance == null || balance < -amount) {
          return Some("MAKER_INSUFFICIENT_FUNDS")
        }
      }
      return None
    },
  })

  const nonceValidation = useQuery({
    enabled: error.isNone(),
    queryKey: ["nonce_is_used", tradeTerms.userId, tradeTerms.nonceBase64],
    queryFn: async () =>
      isNonceUsed({
        nearClient,
        accountId: tradeTerms.userId,
        nonce: tradeTerms.nonceBase64,
      }),
    select: (nonceIsUsed): Option<"NONCE_ALREADY_USED"> => {
      return nonceIsUsed ? Some("NONCE_ALREADY_USED") : None
    },
  })

  const noError = None as typeof error
  error = noError
    .or(nonceValidation.data ?? noError)
    .or(error)
    .or(makerBalanceValidation.data ?? noError)

  return error
}
