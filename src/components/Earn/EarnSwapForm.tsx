"use client"

import type { authHandle } from "@defuse-protocol/internal-utils"
import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import Alert from "@src/components/Alert"
import Button from "@src/components/Button"
import ModalReviewSwap from "@src/components/DefuseSDK/components/Modal/ModalReviewSwap"
import type { ModalSelectAssetsPayload } from "@src/components/DefuseSDK/components/Modal/ModalSelectAssets"
import { nearClient } from "@src/components/DefuseSDK/constants/nearClient"
import TokenInputCard from "@src/components/DefuseSDK/features/deposit/components/DepositForm/TokenInputCard"
import { balanceSelector } from "@src/components/DefuseSDK/features/machines/depositedBalanceMachine"
import type { swapUIMachine } from "@src/components/DefuseSDK/features/machines/swapUIMachine"
import { useTokensUsdPrices } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import { useModalStore } from "@src/components/DefuseSDK/providers/ModalStoreProvider"
import { queryClient } from "@src/components/DefuseSDK/providers/QueryClientProvider"
import { ModalType } from "@src/components/DefuseSDK/stores/modalStore"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import getTokenUsdPrice from "@src/components/DefuseSDK/utils/getTokenUsdPrice"
import { compareAmounts } from "@src/components/DefuseSDK/utils/tokenUtils"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { useSelector } from "@xstate/react"
import { useCallback, useEffect, useRef } from "react"
import { useFormContext } from "react-hook-form"
import type { SnapshotFrom } from "xstate"
import {
  type EarnFormValues,
  EarnUIMachineContext,
} from "./EarnUIMachineProvider"

interface EarnSwapFormProps {
  mode: "deposit" | "withdraw"
  userAddress: authHandle.AuthHandle["identifier"] | undefined
  userChainType: authHandle.AuthHandle["method"] | undefined
  onSuccess?: () => void
  selectableTokens: TokenInfo[]
  submitLabel: string
}

export function EarnSwapForm({
  mode,
  userAddress,
  userChainType,
  onSuccess,
  selectableTokens,
  submitLabel,
}: EarnSwapFormProps) {
  const {
    setValue,
    watch,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useFormContext<EarnFormValues>()

  const actorRef = EarnUIMachineContext.useActorRef()
  const snapshot = EarnUIMachineContext.useSelector((snapshot) => snapshot)
  const intentCreationResult = snapshot.context.intentCreationResult
  const { data: tokensUsdPriceData } = useTokensUsdPrices()

  const formValuesRef = useSelector(actorRef, formValuesSelector)
  const { tokenIn, tokenOut } = formValuesRef
  const amountIn = watch("amountIn")
  const amountOut = watch("amountOut")

  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  // Handle login/logout
  useEffect(() => {
    if (userAddress == null || userChainType == null) {
      actorRef.send({ type: "LOGOUT" })
    } else {
      actorRef.send({ type: "LOGIN", params: { userAddress, userChainType } })
    }
  }, [actorRef, userAddress, userChainType])

  // Handle success events
  useEffect(() => {
    const sub = actorRef.on("*", (event) => {
      switch (event.type) {
        case "INTENT_PUBLISHED": {
          queryClient.invalidateQueries({ queryKey: ["swap_history"] })
          reset()
          break
        }
        case "INTENT_SETTLED":
        case "ONE_CLICK_SETTLED": {
          queryClient.invalidateQueries({ queryKey: ["swap_history"] })
          onSuccessRef.current?.()
          break
        }
      }
    })

    return () => {
      sub.unsubscribe()
    }
  }, [actorRef, reset])

  // Modal for token selection
  const setModalType = useModalStore((state) => state.setModalType)

  const handleSelectToken = useCallback(() => {
    const fieldName = mode === "deposit" ? "tokenIn" : "tokenOut"
    const currentToken = mode === "deposit" ? tokenIn : tokenOut

    setModalType(ModalType.MODAL_SELECT_ASSETS, {
      modalType: ModalType.MODAL_SELECT_ASSETS,
      fieldName,
      [fieldName]: currentToken,
      isHoldingsEnabled: true,
      onConfirm: (payload: ModalSelectAssetsPayload) => {
        const selectedToken = payload[fieldName]
        if (!selectedToken) return

        if (mode === "deposit") {
          actorRef.send({
            type: "input",
            params: {
              tokenIn: selectedToken,
              amountIn,
              amountOut: "",
              swapType: QuoteRequest.swapType.EXACT_INPUT,
            },
          })
        } else {
          actorRef.send({
            type: "input",
            params: {
              tokenOut: selectedToken,
              amountIn,
              amountOut: "",
              swapType: QuoteRequest.swapType.EXACT_INPUT,
            },
          })
        }
        setValue("amountOut", "")
      },
    } satisfies ModalSelectAssetsPayload)
  }, [mode, tokenIn, tokenOut, setModalType, actorRef, amountIn, setValue])

  const {
    noLiquidity,
    insufficientTokenInAmount,
    failedToGetAQuote,
    quote1csError,
  } = EarnUIMachineContext.useSelector((snapshot) => {
    const noLiquidity =
      snapshot.context.quote &&
      snapshot.context.quote.tag === "err" &&
      snapshot.context.quote.value.reason === "ERR_NO_QUOTES"
    const failedToGetAQuote =
      snapshot.context.quote &&
      snapshot.context.quote.tag === "err" &&
      snapshot.context.quote.value.reason === "ERR_NO_QUOTES_1CS"
    const insufficientTokenInAmount =
      snapshot.context.quote &&
      snapshot.context.quote.tag === "err" &&
      snapshot.context.quote.value.reason === "ERR_INSUFFICIENT_AMOUNT"

    return {
      noLiquidity: Boolean(noLiquidity),
      insufficientTokenInAmount: Boolean(insufficientTokenInAmount),
      failedToGetAQuote: Boolean(failedToGetAQuote),
      quote1csError: snapshot.context.quote1csError,
    }
  })

  const depositedBalanceRef = useSelector(
    actorRef,
    (state) => state.children.depositedBalanceRef
  )

  const tokenInBalance = useSelector(
    depositedBalanceRef,
    balanceSelector(tokenIn)
  )

  const _tokenOutBalance = useSelector(
    depositedBalanceRef,
    balanceSelector(tokenOut)
  )

  const balanceInsufficient =
    tokenInBalance != null && snapshot.context.parsedFormValues.amountIn != null
      ? compareAmounts(
          tokenInBalance,
          snapshot.context.parsedFormValues.amountIn
        ) === -1
      : false

  const usdAmountIn = getTokenUsdPrice(amountIn, tokenIn, tokensUsdPriceData)
  const usdAmountOut = getTokenUsdPrice(amountOut, tokenOut, tokensUsdPriceData)

  const is1cs = useIs1CsEnabled()
  const isSubmitting = snapshot.matches("submitting")
  const isSubmitting1cs = is1cs && snapshot.matches("submitting_1cs")
  const isLoadingQuote = snapshot.matches({ editing: "waiting_quote" })

  const handleSetMaxValue = useCallback(async () => {
    if (tokenInBalance == null) return

    const amountInValue = formatTokenValue(
      tokenInBalance.amount,
      tokenInBalance.decimals
    )
    setValue("amountIn", amountInValue)
    setValue("amountOut", "")
    actorRef.send({
      type: "input",
      params: {
        amountIn: amountInValue,
        amountOut: "",
        swapType: QuoteRequest.swapType.EXACT_INPUT,
      },
    })
  }, [tokenInBalance, setValue, actorRef])

  const onRequestReview = () => actorRef.send({ type: "REQUEST_REVIEW" })

  const onSubmit = useCallback(() => {
    if (userAddress == null || userChainType == null) {
      return
    }

    actorRef.send({
      type: "submit",
      params: {
        userAddress,
        userChainType,
        nearClient,
      },
    })
  }, [actorRef, userAddress, userChainType])

  const isReviewOpen =
    snapshot.matches({ editing: "reviewing" }) ||
    snapshot.matches("submitting") ||
    snapshot.matches("submitting_1cs")

  const balanceAmountIn = tokenInBalance?.amount ?? 0n
  const amountInEmpty = amountIn === ""
  const amountOutEmpty = amountOut === ""

  // For deposits: user can select tokenIn, tokenOut is locked to smUSDC
  // For withdrawals: tokenIn is locked to smUSDC, user can select tokenOut
  const inputToken = tokenIn
  const outputToken = tokenOut

  return (
    <>
      <TokenInputCard
        balance={balanceAmountIn}
        decimals={tokenInBalance?.decimals ?? 6}
        symbol={inputToken.symbol}
        handleSetMax={handleSetMaxValue}
        usdAmount={usdAmountIn}
        loading={isLoadingQuote && amountInEmpty}
        selectedToken={inputToken}
        tokens={selectableTokens}
        handleSelectToken={handleSelectToken}
        registration={{
          ...register("amountIn", {
            required: true,
            validate: (value) => {
              if (!value) return true
              const num = Number.parseFloat(value.replace(",", "."))
              return (!Number.isNaN(num) && num > 0) || "Enter a valid amount"
            },
            onChange: (e) => {
              setValue("amountOut", "")
              actorRef.send({
                type: "input",
                params: {
                  swapType: QuoteRequest.swapType.EXACT_INPUT,
                  amountIn: e.target.value,
                  amountOut: "",
                },
              })
            },
          }),
          value: amountIn,
        }}
        error={errors.amountIn ? errors.amountIn.message : undefined}
      />

      {/* Quote output display */}
      {(amountOut || isLoadingQuote) && (
        <div className="mt-3 p-3 bg-gray-50 rounded-xl">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">You will receive</span>
            <span className="font-medium text-gray-900">
              {isLoadingQuote && !amountOut ? (
                <span className="text-gray-400">Calculating...</span>
              ) : (
                `${amountOut} ${outputToken.symbol}`
              )}
            </span>
          </div>
          {usdAmountOut != null && usdAmountOut > 0 && (
            <div className="text-right text-xs text-gray-500 mt-0.5">
              ≈ ${usdAmountOut.toFixed(2)}
            </div>
          )}
        </div>
      )}

      {quote1csError && (
        <Alert variant="error" className="mt-3">
          {quote1csError}
        </Alert>
      )}

      <div className="mt-4">
        <Button
          type="button"
          size="xl"
          fullWidth
          loading={isLoadingQuote}
          disabled={
            (amountInEmpty && amountOutEmpty) ||
            isLoadingQuote ||
            noLiquidity ||
            balanceInsufficient ||
            insufficientTokenInAmount ||
            failedToGetAQuote ||
            userAddress == null
          }
          onClick={handleSubmit(onRequestReview)}
        >
          {renderButtonText(
            userAddress == null,
            amountInEmpty,
            amountOutEmpty,
            noLiquidity,
            balanceInsufficient,
            insufficientTokenInAmount,
            failedToGetAQuote,
            submitLabel
          )}
        </Button>
      </div>

      <ModalReviewSwap
        open={isReviewOpen}
        onClose={() => actorRef.send({ type: "CANCEL_REVIEW" })}
        onConfirm={onSubmit}
        loading={isSubmitting || isSubmitting1cs}
        intentCreationResult={intentCreationResult}
        tokenIn={tokenIn}
        tokenOut={tokenOut}
        amountIn={amountIn}
        amountOut={amountOut}
        usdAmountIn={usdAmountIn ?? 0}
        usdAmountOut={usdAmountOut ?? 0}
      />
    </>
  )
}

function renderButtonText(
  notConnected: boolean,
  amountInEmpty: boolean,
  amountOutEmpty: boolean,
  noLiquidity: boolean,
  balanceInsufficient: boolean,
  insufficientTokenInAmount: boolean,
  failedToGetAQuote: boolean,
  submitLabel: string
) {
  if (notConnected) return "Connect wallet"
  if (amountInEmpty && amountOutEmpty) return "Enter an amount"
  if (noLiquidity) return "No liquidity providers"
  if (balanceInsufficient) return "Insufficient balance"
  if (insufficientTokenInAmount) return "Insufficient amount"
  if (failedToGetAQuote) return "Failed to get a quote"
  return submitLabel
}

function formValuesSelector(snapshot: SnapshotFrom<typeof swapUIMachine>) {
  return snapshot.context.formValues
}
