import { ArrowsDownUpIcon } from "@phosphor-icons/react"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Box, Button, Callout } from "@radix-ui/themes"
import { useTokensUsdPrices } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import {
  formatTokenValue,
  formatUsdAmount,
} from "@src/components/DefuseSDK/utils/format"
import getTokenUsdPrice from "@src/components/DefuseSDK/utils/getTokenUsdPrice"
import { getTokenId } from "@src/components/DefuseSDK/utils/token"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { useThrottledValue } from "@src/hooks/useThrottledValue"
import { useSelector } from "@xstate/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Fragment,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react"
import { useFormContext } from "react-hook-form"
import type { ActorRefFrom, SnapshotFrom } from "xstate"
import { AuthGate } from "../../../components/AuthGate"
import { BlockMultiBalances } from "../../../components/Block/BlockMultiBalances"
import { ButtonCustom } from "../../../components/Button/ButtonCustom"
import { Swap1csCard } from "../../../components/IntentCard/Swap1csCard"
import { SwapIntentCard } from "../../../components/IntentCard/SwapIntentCard"
import type { ModalSelectAssetsPayload } from "../../../components/Modal/ModalSelectAssets"
import { PriceChangeDialog } from "../../../components/PriceChangeDialog"
import { SelectAssets } from "../../../components/SelectAssets"
import { SWAP_TOKEN_FLAGS } from "../../../constants/swap"
import { useModalStore } from "../../../providers/ModalStoreProvider"
import { ModalType } from "../../../stores/modalStore"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { cn } from "../../../utils/cn"
import { compareAmounts } from "../../../utils/tokenUtils"
import { TokenAmountInputCard } from "../../deposit/components/DepositForm/TokenAmountInputCard"
import {
  balanceSelector,
  transitBalanceSelector,
} from "../../machines/depositedBalanceMachine"
import type { intentStatusMachine } from "../../machines/intentStatusMachine"
import type { oneClickStatusMachine } from "../../machines/oneClickStatusMachine"
import {
  type Context,
  ONE_CLICK_PREFIX,
  type swapUIMachine,
} from "../../machines/swapUIMachine"
import { SwapPriceImpact } from "./SwapPriceImpact"
import { SwapRateInfo } from "./SwapRateInfo"
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
    getValues,
    watch,
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
    const { amountIn, amountOut } = getValues()
    setValue("amountIn", amountOut)
    setValue("amountOut", amountIn)
    swapUIActorRef.send({
      type: "input",
      params: {
        tokenIn: tokenOut,
        tokenOut: tokenIn,
      },
    })
  }, [tokenIn, tokenOut, getValues, setValue, swapUIActorRef.send])

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
      const { tokenIn, tokenOut } =
        swapUIActorRef.getSnapshot().context.formValues

      switch (fieldName) {
        case SWAP_TOKEN_FLAGS.IN:
          if (getTokenId(tokenOut) === getTokenId(token)) {
            // Don't need to switch amounts, when token selected from dialog
            swapUIActorRef.send({
              type: "input",
              params: { tokenIn: tokenOut, tokenOut: tokenIn },
            })
          } else {
            swapUIActorRef.send({ type: "input", params: { tokenIn: token } })
          }
          break
        case SWAP_TOKEN_FLAGS.OUT:
          if (getTokenId(tokenIn) === getTokenId(token)) {
            // Don't need to switch amounts, when token selected from dialog
            swapUIActorRef.send({
              type: "input",
              params: { tokenIn: tokenOut, tokenOut: tokenIn },
            })
          } else {
            swapUIActorRef.send({ type: "input", params: { tokenOut: token } })
          }
          break
      }
    }
  }, [payload, currentModalType, swapUIActorRef])

  const { onSubmit } = useContext(SwapSubmitterContext)

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

  const showDepositButton =
    tokenInBalance != null && tokenInBalance.amount === 0n

  const usdAmountIn = getTokenUsdPrice(
    watch("amountIn"),
    tokenIn,
    tokensUsdPriceData
  )
  const usdAmountOut = getTokenUsdPrice(
    watch("amountOut"),
    tokenOut,
    tokensUsdPriceData
  )

  const is1cs = useIs1CsEnabled()
  const isLoading =
    snapshot.matches({ editing: "waiting_quote" }) ||
    (is1cs &&
      snapshot.matches("submitting_1cs") &&
      !(
        snapshot.context.quote?.tag === "ok" &&
        snapshot.context.quote.value.tokenDeltas.find(
          ([, delta]) => delta > 0n
        )?.[1]
      ))

  const handleSetMaxValue = async () => {
    if (tokenInBalance != null) {
      const amountIn = formatTokenValue(
        tokenInBalance.amount,
        tokenInBalance.decimals
      )
      setValue("amountIn", amountIn)
      swapUIActorRef.send({
        type: "input",
        params: {
          amountIn,
        },
      })
    }
  }

  const handleSetHalfValue = async () => {
    if (tokenInBalance != null) {
      const amountIn = formatTokenValue(
        tokenInBalance.amount / 2n,
        tokenInBalance.decimals
      )
      setValue("amountIn", amountIn)
      swapUIActorRef.send({ type: "input", params: { amountIn } })
    }
  }

  const balanceAmountIn = tokenInBalance?.amount ?? 0n
  const balanceAmountOut = tokenOutBalance?.amount ?? 0n
  const disabledIn = tokenInBalance?.amount === 0n

  const showPriceImpact = usdAmountIn && usdAmountOut && !isLoading
  const showRateInfo = tokenIn && tokenOut && !isLoading

  const isLongLoading = useThrottledValue(isLoading, isLoading ? 3000 : 0)

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col items-center">
          <TokenAmountInputCard
            variant="2"
            labelSlot={
              <label
                htmlFor="swap-form-amount-in"
                className="font-bold text-label text-sm"
              >
                Sell
              </label>
            }
            inputSlot={
              <TokenAmountInputCard.Input
                id="swap-form-amount-in"
                {...register("amountIn", {
                  required: true,
                  validate: (value) => {
                    if (!value) return true
                    const num = Number.parseFloat(value.replace(",", "."))
                    return (
                      (!Number.isNaN(num) && num > 0) || "Enter a valid amount"
                    )
                  },
                  onChange: (e) => {
                    swapUIActorRef.send({
                      type: "input",
                      params: { amountIn: e.target.value },
                    })
                  },
                })}
              />
            }
            tokenSlot={
              <SelectAssets
                selected={tokenIn ?? undefined}
                handleSelect={() =>
                  openModalSelectAssets(SWAP_TOKEN_FLAGS.IN, tokenIn)
                }
              />
            }
            balanceSlot={
              <BlockMultiBalances
                balance={tokenInBalance?.amount ?? 0n}
                decimals={tokenInBalance?.decimals ?? 0}
                className={cn("!static", tokenInBalance == null && "invisible")}
                maxButtonSlot={
                  <BlockMultiBalances.DisplayMaxButton
                    onClick={handleSetMaxValue}
                    balance={balanceAmountIn}
                    disabled={disabledIn}
                  />
                }
                halfButtonSlot={
                  <BlockMultiBalances.DisplayHalfButton
                    onClick={handleSetHalfValue}
                    balance={balanceAmountIn}
                    disabled={disabledIn}
                  />
                }
                transitBalance={tokenInTransitBalance}
              />
            }
            priceSlot={
              <TokenAmountInputCard.DisplayPrice>
                {usdAmountIn !== null && usdAmountIn > 0
                  ? formatUsdAmount(usdAmountIn)
                  : null}
              </TokenAmountInputCard.DisplayPrice>
            }
            infoSlot={
              errors.amountIn && (
                <p className="text-label text-sm text-red-500">
                  {errors.amountIn.message || "This field is required"}
                </p>
              )
            }
          />

          <button
            type="button"
            // mousedown event is used to prevent the button from stealing focus
            onMouseDown={(e) => {
              e.preventDefault()
              switchTokens()
            }}
            className="size-10 -my-3.5 rounded-[10px] bg-accent-1 flex items-center justify-center z-10"
          >
            <ArrowsDownUpIcon className="size-5" weight="bold" />
          </button>

          <div className="flex flex-col gap-3">
            <TokenAmountInputCard
              variant="2"
              labelSlot={
                <label
                  htmlFor="swap-form-amount-out"
                  className="font-bold text-label text-sm"
                >
                  Buy
                </label>
              }
              inputSlot={
                <TokenAmountInputCard.Input
                  id="swap-form-amount-out"
                  {...register("amountOut", {
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
                      swapUIActorRef.send({
                        type: "input",
                        params: { amountOut: e.target.value },
                      })
                    },
                  })}
                />
              }
              tokenSlot={
                <SelectAssets
                  selected={tokenOut ?? undefined}
                  handleSelect={() =>
                    openModalSelectAssets(SWAP_TOKEN_FLAGS.OUT, tokenOut)
                  }
                />
              }
              balanceSlot={
                <BlockMultiBalances
                  balance={balanceAmountOut}
                  decimals={tokenOutBalance?.decimals ?? 0}
                  className={cn(
                    "!static",
                    tokenOutBalance == null && "invisible"
                  )}
                  maxButtonSlot={
                    <BlockMultiBalances.DisplayMaxButton
                      balance={balanceAmountOut}
                      disabled={true}
                    />
                  }
                  halfButtonSlot={
                    <BlockMultiBalances.DisplayHalfButton
                      balance={balanceAmountOut}
                      disabled={true}
                    />
                  }
                />
              }
              priceSlot={
                <TokenAmountInputCard.DisplayPrice>
                  {usdAmountOut !== null && usdAmountOut > 0
                    ? formatUsdAmount(usdAmountOut)
                    : null}
                </TokenAmountInputCard.DisplayPrice>
              }
              infoSlot={
                isLongLoading ? (
                  <TokenAmountInputCard.DisplayInfo>
                    Searching for more liquidity...
                  </TokenAmountInputCard.DisplayInfo>
                ) : null
              }
            />
          </div>
        </div>

        {quote1csError && <Quote1csError quote1csError={quote1csError} />}

        <AuthGate
          renderHostAppLink={renderHostAppLink}
          shouldRender={isLoggedIn}
        >
          {showDepositButton ? (
            renderHostAppLink(
              "deposit",
              <Button asChild size="4" className="w-full h-14 font-bold">
                <div>Go to Deposit</div>
              </Button>,
              { className: "w-full" }
            )
          ) : (
            <ButtonCustom
              type="submit"
              size="lg"
              fullWidth
              isLoading={
                snapshot.matches("submitting") ||
                snapshot.matches("submitting_1cs")
              }
              disabled={
                balanceInsufficient ||
                noLiquidity ||
                insufficientTokenInAmount ||
                failedToGetAQuote
              }
            >
              {renderSwapButtonText(
                noLiquidity,
                balanceInsufficient,
                insufficientTokenInAmount,
                failedToGetAQuote
              )}
            </ButtonCustom>
          )}
        </AuthGate>

        {(showPriceImpact || showRateInfo) && (
          <>
            <SwapPriceImpact
              amountIn={usdAmountIn}
              amountOut={isLoading ? null : usdAmountOut}
            />
            <SwapRateInfo tokenIn={tokenIn} tokenOut={tokenOut} />
          </>
        )}
      </form>

      {renderIntentCreationResult(intentCreationResult)}
      {snapshot.context.intentRefs.length > 0 && (
        <Box className="mt-5">
          <Intents intentRefs={snapshot.context.intentRefs} />
        </Box>
      )}

      {snapshot.context.priceChangeDialog && (
        <PriceChangeDialog
          open={true}
          tokenIn={tokenIn}
          tokenOut={tokenOut}
          amountIn={{
            amount: snapshot.context.parsedFormValues.amountIn?.amount ?? 0n,
            decimals: snapshot.context.parsedFormValues.amountIn?.decimals ?? 0,
          }}
          newAmountOut={snapshot.context.priceChangeDialog.pendingNewAmountOut}
          previousAmountOut={
            snapshot.context.priceChangeDialog.previousAmountOut
          }
          onConfirm={() =>
            swapUIActorRef.send({ type: "PRICE_CHANGE_CONFIRMED" })
          }
          onCancel={() =>
            swapUIActorRef.send({ type: "PRICE_CHANGE_CANCELLED" })
          }
        />
      )}
    </div>
  )
}

function Quote1csError({ quote1csError }: { quote1csError: string }) {
  const searchParams = useSearchParams()

  const newSearchParams = useMemo(() => {
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set("not1cs", "true")
    newSearchParams.delete("1cs")
    return newSearchParams
  }, [searchParams])

  return (
    <>
      <div className="mb-5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
        <p className="font-medium">Error:</p>
        <p>{quote1csError}</p>
      </div>
      <div className="text-center mb-5">
        Try{" "}
        <Link
          href={`/?${newSearchParams.toString()}`}
          className="underline text-blue-c11"
        >
          switching to legacy swap
        </Link>{" "}
        if the problem persists
      </div>
    </>
  )
}

function Intents({
  intentRefs,
}: {
  intentRefs: (
    | ActorRefFrom<typeof intentStatusMachine>
    | ActorRefFrom<typeof oneClickStatusMachine>
  )[]
}) {
  return (
    <div>
      {intentRefs.map((intentRef) => {
        const isOneClick = intentRef.id?.startsWith(ONE_CLICK_PREFIX)

        return (
          <Fragment key={intentRef.id}>
            {isOneClick ? (
              <Swap1csCard
                oneClickStatusActorRef={
                  intentRef as ActorRefFrom<typeof oneClickStatusMachine>
                }
              />
            ) : (
              <SwapIntentCard
                intentStatusActorRef={
                  intentRef as ActorRefFrom<typeof intentStatusMachine>
                }
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

function renderSwapButtonText(
  noLiquidity: boolean,
  balanceInsufficient: boolean,
  insufficientTokenInAmount: boolean,
  failedToGetAQuote: boolean
) {
  if (noLiquidity) return "No liquidity providers"
  if (balanceInsufficient) return "Insufficient Balance"
  if (insufficientTokenInAmount) return "Insufficient amount"
  if (failedToGetAQuote) return "Failed to get a quote"
  return "Swap"
}

export function renderIntentCreationResult(
  intentCreationResult: Context["intentCreationResult"]
) {
  if (!intentCreationResult || intentCreationResult.tag === "ok") {
    return null
  }

  let content: ReactNode = null

  const status = intentCreationResult.value.reason
  switch (status) {
    case "ERR_USER_DIDNT_SIGN":
      content =
        "It seems the message wasn’t signed in your wallet. Please try again."
      break

    case "ERR_CANNOT_VERIFY_SIGNATURE":
      content =
        "We couldn’t verify your signature, please try again with another wallet."
      break

    case "ERR_SIGNED_DIFFERENT_ACCOUNT":
      content =
        "The message was signed with a different wallet. Please try again."
      break

    case "ERR_PUBKEY_ADDING_DECLINED":
      content = null
      break

    case "ERR_PUBKEY_CHECK_FAILED":
      content =
        "We couldn’t verify your key, possibly due to a connection issue."
      break

    case "ERR_PUBKEY_ADDING_FAILED":
      content = "Transaction for adding public key is failed. Please try again."
      break

    case "ERR_PUBKEY_EXCEPTION":
      content = "An error occurred while adding public key. Please try again."
      break

    case "ERR_QUOTE_EXPIRED_RETURN_IS_LOWER":
      content =
        "The quote has expired or the return is lower than expected. Please try again."
      break

    case "ERR_CANNOT_PUBLISH_INTENT":
      content =
        "We couldn’t send your request, possibly due to a network issue or server downtime. Please check your connection or try again later."
      break

    case "ERR_WALLET_POPUP_BLOCKED":
      content = "Please allow popups and try again."
      break

    case "ERR_WALLET_CANCEL_ACTION":
      content = null
      break

    case "ERR_1CS_QUOTE_FAILED":
      content = "Failed to get quote. Please try again."
      break

    case "ERR_NO_DEPOSIT_ADDRESS":
      content = "No deposit address in the quote"
      break

    case "ERR_TRANSFER_MESSAGE_FAILED":
      content = "Failed to create transfer message. Please try again."
      break

    default:
      status satisfies never
      content = `An error occurred. Please try again. ${status}`
  }

  if (content == null) {
    return null
  }

  return (
    <Callout.Root size="1" color="red">
      <Callout.Icon>
        <ExclamationTriangleIcon />
      </Callout.Icon>
      <Callout.Text>{content}</Callout.Text>
    </Callout.Root>
  )
}

function formValuesSelector(snapshot: SnapshotFrom<typeof swapUIMachine>) {
  return snapshot.context.formValues
}
