"use client"
import { useQuery } from "@tanstack/react-query"
import { Err, Ok, type Result } from "@thames/monads"
import { type ReactNode, useMemo, useState } from "react"

import { WidgetRoot } from "../../../components/WidgetRoot"
import { nearClient } from "../../../constants/nearClient"
import type { IntentsUserId, SignerCredentials } from "../../../core/formatters"
import { logger } from "../../../logger"
import { SwapWidgetProvider } from "../../../providers/SwapWidgetProvider"
import { getDepositedBalances } from "../../../services/defuseBalanceService"
import {
  getProtocolFee,
  isNonceUsed,
} from "../../../services/intentsContractService"
import type { AuthMethod } from "../../../types/authHandle"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../../types/base"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import type { SendNearTransaction } from "../../machines/publicKeyVerifierMachine"
import { SignIntentActorProvider } from "../providers/SignIntentActorProvider"
import { useOtcTakerTrades } from "../stores/otcTakerTrades"
import type { SignMessage } from "../types/sharedTypes"
import {
  type DeriveTradeTermsErr,
  type DetermineInvolvedTokensErr,
  type TradeTerms,
  deriveTradeTerms,
  determineInvolvedTokens,
} from "../utils/deriveTradeTerms"

import { OtcTakerForm } from "./OtcTakerForm"
import { OtcTakerInvalidOrder } from "./OtcTakerInvalidOrder"
import { OtcTakerSuccessScreen } from "./OtcTakerSuccessScreen"

export type OtcTakerWidgetProps = {
  tradeId: string | null
  multiPayload: string | null

  /** List of available tokens for trading */
  tokenList: (BaseTokenInfo | UnifiedTokenInfo)[]

  /** User's wallet address */
  userAddress: string | null | undefined
  userChainType: AuthMethod | null | undefined

  /** Sign message callback */
  signMessage: SignMessage

  /** Send NEAR transaction callback */
  sendNearTransaction: SendNearTransaction

  /** Theme selection */
  theme?: "dark" | "light"

  /** Frontend referral */
  referral?: string

  renderHostAppLink: RenderHostAppLink
}

export function OtcTakerWidget(props: OtcTakerWidgetProps) {
  return (
    <WidgetRoot>
      <SwapWidgetProvider>
        <div className="widget-container rounded-2xl bg-gray-1 p-5 shadow">
          <OtcTakerScreens {...props} />
        </div>
      </SwapWidgetProvider>
    </WidgetRoot>
  )
}

function OtcTakerScreens({
  tradeId,
  multiPayload,
  tokenList,
  userAddress,
  userChainType,
  signMessage,
  sendNearTransaction,
  referral,
  renderHostAppLink,
}: OtcTakerWidgetProps) {
  const loading = <div>Loading...</div>

  const signerCredentials: SignerCredentials | null =
    userAddress != null && userChainType != null
      ? { credential: userAddress, credentialType: userChainType }
      : null

  const { data: protocolFee } = useQuery({
    queryKey: ["protocol_fee"],
    queryFn: () => getProtocolFee({ nearClient }),
  })

  const enrichedTradeTerms = useMemo(() => {
    if (protocolFee == null || multiPayload == null) {
      return null
    }

    const result = deriveTradeTerms(multiPayload, protocolFee)
      .mapErr<DeriveTradeTermsErr | DetermineInvolvedTokensErr>((a) => a)
      .andThen((tradeTerms) => {
        return determineInvolvedTokens(
          tokenList,
          tradeTerms.takerTokenDiff
        ).map((tokens) => ({
          ...tokens,
          tradeTerms,
        }))
      })

    if (result.isErr()) {
      logger.error(result.unwrapErr())
    }

    return result
  }, [multiPayload, tokenList, protocolFee])

  const [publishResult, setPublishResult] = useState<{
    intentHashes: string[]
  } | null>(null)

  const knownOtcTakerTrade = useOtcTakerTrades((state) =>
    tradeId != null ? state.trades[tradeId] : null
  )

  if (enrichedTradeTerms == null) {
    return loading
  }

  return enrichedTradeTerms.match({
    ok: ({ tradeTerms, tokenIn, tokenOut }) =>
      publishResult != null ? (
        <OtcTakerSuccessScreen
          tradeTerms={tradeTerms}
          intentHashes={publishResult.intentHashes}
          tokenIn={tokenIn}
          tokenOut={tokenOut}
          renderHostAppLink={renderHostAppLink}
        />
      ) : knownOtcTakerTrade?.status === "completed" ? (
        <OtcTakerSuccessScreen
          tradeTerms={tradeTerms}
          intentHashes={knownOtcTakerTrade.intentHashes}
          tokenIn={tokenIn}
          tokenOut={tokenOut}
          renderHostAppLink={renderHostAppLink}
        />
      ) : (
        <OtcTakerValidationOrder
          tradeTerms={tradeTerms}
          tokenIn={tokenIn}
          tokenOut={tokenOut}
          fallback={loading}
        >
          <SignIntentActorProvider sendNearTransaction={sendNearTransaction}>
            {tradeId != null && protocolFee != null && (
              <OtcTakerForm
                tradeId={tradeId}
                tradeTerms={tradeTerms}
                tokenIn={tokenIn}
                tokenOut={tokenOut}
                makerMultiPayload={tradeTerms.makerMultiPayload}
                signerCredentials={signerCredentials}
                signMessage={signMessage}
                protocolFee={protocolFee}
                onSuccessTrade={setPublishResult}
                referral={referral}
                renderHostAppLink={renderHostAppLink}
              />
            )}
          </SignIntentActorProvider>
        </OtcTakerValidationOrder>
      ),
    err: (error) => <OtcTakerInvalidOrder error={error} />,
  })
}

function OtcTakerValidationOrder({
  tradeTerms,
  tokenIn,
  tokenOut,
  fallback,
  children,
}: {
  tradeTerms: TradeTerms
  tokenIn: BaseTokenInfo | UnifiedTokenInfo
  tokenOut: BaseTokenInfo | UnifiedTokenInfo
  fallback: ReactNode
  children: ReactNode
}) {
  let error: Result<true, string> = Ok(true)

  if (new Date(tradeTerms.deadline) < new Date()) {
    error = Err("ORDER_EXPIRED")
  }

  const makerBalanceValidation = useQuery({
    enabled: error.isOk(),
    queryKey: [
      "deposited_balance",
      tradeTerms.makerUserId,
      Object.keys(tradeTerms.makerTokenDiff),
    ],
    queryFn: () => {
      return getDepositedBalances(
        tradeTerms.makerUserId as IntentsUserId,
        Object.keys(tradeTerms.makerTokenDiff),
        nearClient
      )
    },
    select: (makerTokenBalances): Result<true, "MAKER_INSUFFICIENT_FUNDS"> => {
      for (const [tokenId, amount] of Object.entries(
        tradeTerms.makerTokenDiff
      )) {
        if (amount >= 0) {
          continue
        }

        const balance = makerTokenBalances[tokenId]

        if (balance == null || balance < -amount) {
          return Err("MAKER_INSUFFICIENT_FUNDS")
        }
      }
      return Ok(true)
    },
  })

  const nonceValidation = useQuery({
    enabled: error.isOk(),
    queryKey: [
      "nonce_is_used",
      tradeTerms.makerUserId,
      tradeTerms.makerNonceBase64,
    ],
    queryFn: async () =>
      isNonceUsed({
        nearClient,
        accountId: tradeTerms.makerUserId,
        nonce: tradeTerms.makerNonceBase64,
      }),
    select: (nonceIsUsed): Result<true, "NONCE_ALREADY_USED"> => {
      return nonceIsUsed ? Err("NONCE_ALREADY_USED") : Ok(true)
    },
  })

  if (
    error.isErr() ||
    makerBalanceValidation.data?.isErr() ||
    nonceValidation.data?.isErr()
  ) {
    const noError = Ok(true) as typeof error
    error = noError
      .andThen(() => nonceValidation.data ?? noError)
      .andThen(() => error)
      .andThen(() => makerBalanceValidation.data ?? noError)

    return (
      <OtcTakerInvalidOrder
        error={error.unwrapErr()}
        tradeTerms={tradeTerms}
        tokenIn={tokenIn}
        tokenOut={tokenOut}
      />
    )
  }

  if (makerBalanceValidation.data == null || nonceValidation.data == null) {
    return fallback
  }

  return children
}
