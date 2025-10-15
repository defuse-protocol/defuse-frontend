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
import clsx from "clsx"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Fragment, type ReactNode, useContext, useMemo } from "react"
import type { ActorRefFrom } from "xstate"
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
import { compareAmounts } from "../../../utils/tokenUtils"
import { TokenAmountInputCard } from "../../deposit/components/DepositForm/TokenAmountInputCard"
import {
  balanceSelector,
  transitBalanceSelector,
} from "../../machines/depositedBalanceMachine"
import type { intentStatusMachine } from "../../machines/intentStatusMachine"
import type { oneClickStatusMachine } from "../../machines/oneClickStatusMachine"
import { type Context, ONE_CLICK_PREFIX } from "../../machines/swapUIMachine"
import { formValuesSelector } from "../actors/swapFormMachine"
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
  const swapUIActorRef = SwapUIMachineContext.useActorRef()
  const snapshot = SwapUIMachineContext.useSelector((snapshot) => snapshot)
  const intentCreationResult = snapshot.context.intentCreationResult
  const { data: tokensUsdPriceData } = useTokensUsdPrices()

  const formRef = useSelector(swapUIActorRef, (s) => s.context.formRef)
  const formValuesRef = useSelector(formRef, formValuesSelector)
  const formValues = useSelector(formValuesRef, (s) => s.context)
  const { tokenIn, tokenOut, amountIn, amountOut } = formValues

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

  const { setModalType, payload } = useModalStore((state) => state)

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
      onConfirm: (payload: ModalSelectAssetsPayload) => {
        const { fieldName } = payload as ModalSelectAssetsPayload
        const _payload = payload as ModalSelectAssetsPayload
        const token = _payload[fieldName || "token"]

        if (fieldName && token) {
          switch (fieldName) {
            case SWAP_TOKEN_FLAGS.IN:
              if (getTokenId(tokenOut) === getTokenId(token)) {
                formValuesRef.trigger.switchTokens()
              } else {
                formValuesRef.trigger.updateTokenIn({ value: token })
              }
              break
            case SWAP_TOKEN_FLAGS.OUT:
              if (getTokenId(tokenIn) === getTokenId(token)) {
                formValuesRef.trigger.switchTokens()
              } else {
                formValuesRef.trigger.updateTokenOut({ value: token })
              }
              break
          }
        }
      },
    })
  }

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

  const parsedValuesRef = useSelector(formRef, (s) => s.context.parsedValues)
  const parsedValues = useSelector(parsedValuesRef, (s) => s.context)

  const balanceInsufficient =
    tokenInBalance != null && parsedValues.amountIn != null
      ? compareAmounts(tokenInBalance, parsedValues.amountIn) === -1
      : false

  const showDepositButton =
    tokenInBalance != null && tokenInBalance.amount === 0n

  const usdAmountIn = getTokenUsdPrice(amountIn, tokenIn, tokensUsdPriceData)
  const usdAmountOut = getTokenUsdPrice(amountOut, tokenOut, tokensUsdPriceData)

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

  const handleSetMaxValue = async (
    fieldName: typeof SWAP_TOKEN_FLAGS.IN | typeof SWAP_TOKEN_FLAGS.OUT
  ) => {
    if (fieldName === SWAP_TOKEN_FLAGS.IN) {
      if (tokenInBalance != null) {
        formValuesRef.trigger.updateAmountIn({
          value: formatTokenValue(
            tokenInBalance.amount,
            tokenInBalance.decimals
          ),
        })
      }
    }
  }

  const handleSetHalfValue = async (
    fieldName: typeof SWAP_TOKEN_FLAGS.IN | typeof SWAP_TOKEN_FLAGS.OUT
  ) => {
    if (fieldName === SWAP_TOKEN_FLAGS.IN) {
      if (tokenInBalance != null) {
        formValuesRef.trigger.updateAmountIn({
          value: formatTokenValue(
            tokenInBalance.amount / 2n,
            tokenInBalance.decimals
          ),
        })
      }
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
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        className="flex flex-col gap-5"
      >
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
                name="amountIn"
                value={amountIn}
                onChange={(e) => {
                  formValuesRef.trigger.updateAmountIn({
                    value: e.target.value,
                  })
                }}
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
                className={clsx(
                  "!static",
                  tokenInBalance == null && "invisible"
                )}
                maxButtonSlot={
                  <BlockMultiBalances.DisplayMaxButton
                    onClick={() => handleSetMaxValue(SWAP_TOKEN_FLAGS.IN)}
                    balance={balanceAmountIn}
                    disabled={disabledIn}
                  />
                }
                halfButtonSlot={
                  <BlockMultiBalances.DisplayHalfButton
                    onClick={() => handleSetHalfValue(SWAP_TOKEN_FLAGS.IN)}
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
          />

          <button
            type="button"
            // mousedown event is used to prevent the button from stealing focus
            onMouseDown={(e) => {
              e.preventDefault()
              formValuesRef.trigger.switchTokens()
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
                  name="amountOut"
                  value={amountOut}
                  disabled={true}
                  isLoading={isLoading}
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
                  className={clsx(
                    "!static",
                    tokenOutBalance == null && "invisible"
                  )}
                  maxButtonSlot={
                    <BlockMultiBalances.DisplayMaxButton
                      onClick={() => handleSetMaxValue(SWAP_TOKEN_FLAGS.OUT)}
                      balance={balanceAmountOut}
                      disabled={true}
                    />
                  }
                  halfButtonSlot={
                    <BlockMultiBalances.DisplayHalfButton
                      onClick={() => handleSetHalfValue(SWAP_TOKEN_FLAGS.OUT)}
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
            amount: parsedValues.amountIn?.amount ?? 0n,
            decimals: parsedValues.amountIn?.decimals ?? 0,
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
