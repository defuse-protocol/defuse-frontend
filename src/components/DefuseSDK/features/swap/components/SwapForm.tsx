import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid"
import { ArrowDownIcon } from "@heroicons/react/20/solid"
import Alert from "@src/components/Alert"
import Button from "@src/components/Button"
import ModalReviewSwap from "@src/components/DefuseSDK/components/Modal/ModalReviewSwap"
import { useTokensUsdPrices } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import { useTokensStore } from "@src/components/DefuseSDK/providers/TokensStoreProvider"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import getTokenUsdPrice from "@src/components/DefuseSDK/utils/getTokenUsdPrice"
import { getDefuseAssetId } from "@src/components/DefuseSDK/utils/token"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { useThrottledValue } from "@src/hooks/useThrottledValue"
import { useSelector } from "@xstate/react"
import { useCallback, useContext, useEffect } from "react"
import { useFormContext } from "react-hook-form"
import type { SnapshotFrom } from "xstate"
import { AuthGate } from "../../../components/AuthGate"
import type { ModalSelectAssetsPayload } from "../../../components/Modal/ModalSelectAssets"
import { SWAP_TOKEN_FLAGS } from "../../../constants/swap"
import { useModalStore } from "../../../providers/ModalStoreProvider"
import { ModalType } from "../../../stores/modalStore"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { compareAmounts } from "../../../utils/tokenUtils"
import TokenInputCard from "../../deposit/components/DepositForm/TokenInputCard"
import {
  balanceSelector,
  transitBalanceSelector,
} from "../../machines/depositedBalanceMachine"
import type { swapUIMachine } from "../../machines/swapUIMachine"
import { useUsdMode } from "../hooks/useUsdMode"
import SwapSettings from "./SwapSettings"
import { SwapSubmitterContext } from "./SwapSubmitter"
import { SwapUIMachineContext } from "./SwapUIMachineProvider"

export type SwapFormValues = {
  amountIn: string
  amountOut: string
}

export interface SwapFormProps {
  isLoggedIn: boolean
  renderHostAppLink: RenderHostAppLink
}

export const SwapForm = ({ isLoggedIn, renderHostAppLink }: SwapFormProps) => {
  const {
    setValue,
    watch,
    getValues,
    register,
    handleSubmit,
    formState: { errors },
  } = useFormContext<SwapFormValues>()

  const swapUIActorRef = SwapUIMachineContext.useActorRef()
  const snapshot = SwapUIMachineContext.useSelector((snapshot) => snapshot)
  const intentCreationResult = snapshot.context.intentCreationResult
  const { data: tokensUsdPriceData } = useTokensUsdPrices()

  const formValuesRef = useSelector(swapUIActorRef, formValuesSelector)
  const { tokenIn, tokenOut } = formValuesRef
  const amountIn = watch("amountIn")
  const amountOut = watch("amountOut")
  const tokens = useTokensStore((state) => state.tokens)

  const {
    noLiquidity,
    insufficientTokenInAmount,
    failedToGetAQuote,
    quote1csError,
  } = SwapUIMachineContext.useSelector((snapshot) => {
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

  // we need stable references to allow passing to useEffect
  const switchTokens = useCallback(() => {
    const { amountOut } = getValues()
    setValue("amountIn", amountOut)
    setValue("amountOut", "")
    swapUIActorRef.send({
      type: "input",
      params: {
        tokenIn: tokenOut,
        tokenOut: tokenIn,
        amountIn: amountOut,
        amountOut: "",
        swapType: QuoteRequest.swapType.EXACT_INPUT,
      },
    })
  }, [tokenIn, tokenOut, setValue, getValues, swapUIActorRef])

  const {
    setModalType,
    payload,
    modalType: currentModalType,
  } = useModalStore((state) => state)

  const openModalSelectAssets = (
    fieldName: string,
    token: TokenInfo | undefined
  ) => {
    setModalType(ModalType.MODAL_SELECT_ASSETS, {
      ...(payload as ModalSelectAssetsPayload),
      fieldName,
      [fieldName]: token,
      isHoldingsEnabled: true,
      isMostTradableTokensEnabled: true,
    })
  }

  useEffect(() => {
    if (
      currentModalType !== null ||
      (payload as ModalSelectAssetsPayload)?.modalType !==
        ModalType.MODAL_SELECT_ASSETS
    ) {
      return
    }
    const { modalType, fieldName } = payload as ModalSelectAssetsPayload
    const _payload = payload as ModalSelectAssetsPayload
    const token = _payload[fieldName || "token"]
    if (modalType === ModalType.MODAL_SELECT_ASSETS && fieldName && token) {
      const { tokenIn, tokenOut, swapType } =
        swapUIActorRef.getSnapshot().context.formValues
      const { amountIn, amountOut } = getValues()
      const isExactInput = swapType === QuoteRequest.swapType.EXACT_INPUT
      switch (fieldName) {
        case SWAP_TOKEN_FLAGS.IN: {
          let newAmountIn = ""
          let newAmountOut = ""
          let valueToReset: "amountIn" | "amountOut" = "amountOut"

          if (isExactInput) {
            newAmountIn = amountIn
          } else {
            // If we change TOKEN IN but last touched input was AMOUNT OUT and so current swap type is EXACT_OUTPUT , we SHOULD NOT trigger and EXACT IN quote and keep with EXACT OUT quote
            newAmountOut = amountOut
            valueToReset = "amountIn"
          }
          if (getDefuseAssetId(tokenOut) === getDefuseAssetId(token)) {
            // Don't need to switch amounts, when token selected from dialog
            swapUIActorRef.send({
              type: "input",
              params: {
                tokenIn: tokenOut,
                tokenOut: tokenIn,
                amountIn: newAmountIn,
                amountOut: newAmountOut,
              },
            })
          } else {
            swapUIActorRef.send({
              type: "input",
              params: {
                tokenIn: token,
                amountIn: newAmountIn,
                amountOut: newAmountOut,
              },
            })
          }
          setValue(valueToReset, "")
          break
        }
        case SWAP_TOKEN_FLAGS.OUT: {
          if (is1cs) {
            let newAmountIn = ""
            let newAmountOut = ""
            let valueToReset: "amountIn" | "amountOut" = "amountIn"
            if (isExactInput) {
              // If we change TOKEN OUT but last touched input was AMOUNT IN and so current swap type is EXACT_INPUT, we SHOULD NOT trigger and EXACT OUT quote and keep with EXACT IN quote
              newAmountIn = amountIn
              valueToReset = "amountOut"
            } else {
              newAmountOut = amountOut
            }
            if (getDefuseAssetId(tokenIn) === getDefuseAssetId(token)) {
              // Don't need to switch amounts, when token selected from dialog
              swapUIActorRef.send({
                type: "input",
                params: {
                  tokenIn: tokenOut,
                  tokenOut: tokenIn,
                  amountIn: newAmountIn,
                  amountOut: newAmountOut,
                },
              })
            } else {
              swapUIActorRef.send({
                type: "input",
                params: {
                  tokenOut: token,
                  amountIn: newAmountIn,
                  amountOut: newAmountOut,
                },
              })
            }

            setValue(valueToReset, "")
          } else {
            // legacy flow for non 1cs
            if (getDefuseAssetId(tokenIn) === getDefuseAssetId(token)) {
              // Don't need to switch amounts, when token selected from dialog
              swapUIActorRef.send({
                type: "input",
                params: {
                  tokenIn: tokenOut,
                  tokenOut: tokenIn,
                  amountOut: "",
                  amountIn,
                },
              })
            } else {
              swapUIActorRef.send({
                type: "input",
                params: {
                  tokenOut: token,
                  amountOut: "",
                  amountIn,
                },
              })
            }
            setValue("amountOut", "")
          }
          break
        }
      }
    }
  }, [payload, currentModalType, swapUIActorRef, getValues, setValue])

  const { onSubmit: submitSwap } = useContext(SwapSubmitterContext)

  const onRequestReview = () => swapUIActorRef.send({ type: "REQUEST_REVIEW" })

  const isReviewOpen =
    snapshot.matches({ editing: "reviewing" }) ||
    snapshot.matches("submitting") ||
    snapshot.matches("submitting_1cs")

  const depositedBalanceRef = useSelector(
    swapUIActorRef,
    (state) => state.children.depositedBalanceRef
  )

  const tokenInBalance = useSelector(
    depositedBalanceRef,
    balanceSelector(tokenIn)
  )

  const tokenOutBalance = useSelector(
    depositedBalanceRef,
    balanceSelector(tokenOut)
  )

  const tokenInTransitBalance = useSelector(
    depositedBalanceRef,
    transitBalanceSelector(tokenIn)
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

  const {
    isUsdMode: isUsdModeIn,
    usdValue: usdValueIn,
    tokenPrice: tokenInPrice,
    handleToggle: handleToggleUsdModeIn,
    handleInputChange: handleUsdInputChangeRaw,
  } = useUsdMode({
    direction: "input",
    tokenIn,
    tokenOut,
    tokensUsdPriceData,
    setValue,
    swapUIActorRef,
  })

  const { tokenPrice: tokenOutPrice } = useUsdMode({
    direction: "output",
    tokenIn,
    tokenOut,
    tokensUsdPriceData,
    setValue,
    swapUIActorRef,
  })

  // Wrap handler to clear the output USD value when input changes
  const handleUsdInputChange = useCallback(
    (value: string) => {
      handleUsdInputChangeRaw(value)
    },
    [handleUsdInputChangeRaw]
  )

  const is1cs = useIs1CsEnabled()
  const isSubmitting = snapshot.matches("submitting")
  const isSubmitting1cs = is1cs && snapshot.matches("submitting_1cs")
  const isLoadingQuote = snapshot.matches({ editing: "waiting_quote" })

  const handleSetMaxValue = async () => {
    if (tokenInBalance == null) return

    const amountIn = formatTokenValue(
      tokenInBalance.amount,
      tokenInBalance.decimals
    )
    setValue("amountIn", amountIn)
    setValue("amountOut", "")
    swapUIActorRef.send({
      type: "input",
      params: {
        amountIn,
        amountOut: "",
        swapType: QuoteRequest.swapType.EXACT_INPUT,
      },
    })
  }

  const balanceAmountIn = tokenInBalance?.amount ?? 0n
  const balanceAmountOut = tokenOutBalance?.amount ?? 0n
  const balanceInTransit = tokenInTransitBalance?.amount ?? 0n

  const isLongLoading = useThrottledValue(
    isLoadingQuote,
    isLoadingQuote ? 3000 : 0
  )
  const amountInEmpty = amountIn === ""
  const amountOutEmpty = amountOut === ""
  const amountOutLoading = isLoadingQuote && amountOutEmpty

  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-gray-900 text-xl font-semibold tracking-tight">
          Swap
        </h1>
        <SwapSettings tokenIn={tokenIn} tokenOut={tokenOut} />
      </div>

      <section className="mt-5">
        <form onSubmit={handleSubmit(onRequestReview)}>
          <div>
            <TokenInputCard
              balance={balanceAmountIn}
              decimals={tokenInBalance?.decimals ?? 0}
              symbol={tokenIn.symbol}
              balanceInTransit={balanceInTransit}
              handleSetMax={handleSetMaxValue}
              usdAmount={usdAmountIn}
              loading={isLoadingQuote && amountInEmpty}
              selectAssetsTestId="select-assets-input"
              selectedToken={tokenIn}
              tokens={tokens}
              handleSelectToken={() =>
                openModalSelectAssets(SWAP_TOKEN_FLAGS.IN, tokenIn)
              }
              isUsdMode={isUsdModeIn}
              tokenPrice={tokenInPrice}
              onToggleUsdMode={handleToggleUsdModeIn}
              tokenAmount={amountIn}
              registration={
                isUsdModeIn
                  ? {
                      name: "usdAmountIn",
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        handleUsdInputChange(e.target.value)
                      },
                      onBlur: () => {},
                      ref: () => {},
                      // Show user-entered value, or calculated USD from quote if empty
                      value:
                        usdValueIn ||
                        (usdAmountIn ? usdAmountIn.toFixed(2) : ""),
                    }
                  : {
                      ...register("amountIn", {
                        required: true,
                        validate: (value) => {
                          if (!value) return true
                          const num = Number.parseFloat(value.replace(",", "."))
                          return (
                            (!Number.isNaN(num) && num > 0) ||
                            "Enter a valid amount"
                          )
                        },
                        onChange: (e) => {
                          setValue("amountOut", "")
                          swapUIActorRef.send({
                            type: "input",
                            params: {
                              tokenIn,
                              tokenOut,
                              swapType: QuoteRequest.swapType.EXACT_INPUT,
                              amountIn: e.target.value,
                              amountOut: "",
                            },
                          })
                        },
                      }),
                      value: amountIn,
                    }
              }
              hasError={balanceInsufficient}
              error={
                balanceInsufficient
                  ? "Amount entered exceeds available balance"
                  : errors.amountIn?.message
              }
            />

            <div className="flex items-center justify-center -my-3.5">
              <button
                type="button"
                // Keep focus on the input
                onMouseDown={(e) => e.preventDefault()}
                onClick={switchTokens}
                className="size-9 flex items-center justify-center bg-white border hover:border-gray-300 transition-colors duration-100 border-gray-200 rounded-lg text-gray-400 hover:text-gray-500"
                data-testid="swap-form-switch-tokens-button"
                disabled={amountOutLoading || isSubmitting || isSubmitting1cs}
                aria-label="Switch tokens"
              >
                <ArrowDownIcon className="size-5" />
              </button>
            </div>

            <TokenInputCard
              balance={balanceAmountOut}
              decimals={tokenOutBalance?.decimals ?? 0}
              symbol={tokenOut.symbol}
              usdAmount={usdAmountOut}
              loading={isLoadingQuote && amountInEmpty}
              selectAssetsTestId="select-assets-output"
              selectedToken={tokenOut}
              tokens={tokens}
              handleSelectToken={() =>
                openModalSelectAssets(SWAP_TOKEN_FLAGS.OUT, tokenOut)
              }
              isUsdMode={isUsdModeIn}
              tokenPrice={tokenOutPrice}
              tokenAmount={amountOut}
              isOutputField
              registration={{
                name: "amountOut",
                onChange: () => {},
                onBlur: () => {},
                ref: () => {},
                // When source is in USD mode, show USD value; otherwise show token amount
                value: isUsdModeIn
                  ? usdAmountOut
                    ? usdAmountOut.toFixed(2)
                    : ""
                  : amountOut,
              }}
              readOnly
            />
          </div>

          <AuthGate
            renderHostAppLink={renderHostAppLink}
            shouldRender={isLoggedIn}
          >
            <Button
              className="mt-6"
              type="submit"
              size="xl"
              fullWidth
              loading={isLoadingQuote}
              disabled={
                (amountInEmpty && amountOutEmpty) ||
                isLoadingQuote ||
                noLiquidity ||
                balanceInsufficient ||
                insufficientTokenInAmount ||
                failedToGetAQuote
              }
            >
              {renderSwapButtonText(
                amountInEmpty,
                amountOutEmpty,
                noLiquidity,
                balanceInsufficient,
                insufficientTokenInAmount,
                failedToGetAQuote
              )}
            </Button>
          </AuthGate>

          {isLongLoading && (
            <div className="flex items-center justify-center mt-4 gap-2 animate-in fade-in duration-200 slide-in-from-top-1 zoom-in-97">
              <MagnifyingGlassIcon className="size-4 shrink-0 text-gray-500" />
              <p className="text-sm font-semibold text-gray-500">
                Searching for more liquidity...
              </p>
            </div>
          )}

          {quote1csError && (
            <Alert variant="error" className="mt-4">
              {quote1csError}
            </Alert>
          )}
        </form>

        <ModalReviewSwap
          open={isReviewOpen}
          onClose={() => swapUIActorRef.send({ type: "CANCEL_REVIEW" })}
          onConfirm={submitSwap}
          loading={isSubmitting || isSubmitting1cs}
          intentCreationResult={intentCreationResult}
          tokenIn={tokenIn}
          tokenOut={tokenOut}
          amountIn={amountIn}
          amountOut={amountOut}
          usdAmountIn={usdAmountIn ?? 0}
          usdAmountOut={usdAmountOut ?? 0}
        />
      </section>
    </>
  )
}

function renderSwapButtonText(
  amountInEmpty: boolean,
  amountOutEmpty: boolean,
  noLiquidity: boolean,
  balanceInsufficient: boolean,
  insufficientTokenInAmount: boolean,
  failedToGetAQuote: boolean
) {
  if (amountInEmpty && amountOutEmpty) return "Enter an amount"
  if (noLiquidity) return "No liquidity providers"
  if (balanceInsufficient) return "Insufficient balance"
  if (insufficientTokenInAmount) return "Insufficient amount"
  if (failedToGetAQuote) return "Failed to get a quote"
  return "Review swap"
}

function formValuesSelector(snapshot: SnapshotFrom<typeof swapUIMachine>) {
  return snapshot.context.formValues
}
