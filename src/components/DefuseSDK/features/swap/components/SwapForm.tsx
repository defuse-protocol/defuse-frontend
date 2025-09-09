import * as Accordion from "@radix-ui/react-accordion"
import { CaretDownIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Box, Button, Callout, Flex } from "@radix-ui/themes"
import { TradeNavigationLinks } from "@src/components/DefuseSDK/components/TradeNavigationLinks"
import { useTokensUsdPrices } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import { formatUsdAmount } from "@src/components/DefuseSDK/utils/format"
import getTokenUsdPrice from "@src/components/DefuseSDK/utils/getTokenUsdPrice"
import { useSelector } from "@xstate/react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Fragment,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
} from "react"
import { useFormContext } from "react-hook-form"
import type { ActorRefFrom } from "xstate"
import { AuthGate } from "../../../components/AuthGate"
import { ButtonCustom } from "../../../components/Button/ButtonCustom"
import { ButtonSwitch } from "../../../components/Button/ButtonSwitch"
import { Form } from "../../../components/Form"
import { FieldComboInput } from "../../../components/Form/FieldComboInput"
import { SwapIntentCard } from "../../../components/IntentCard/SwapIntentCard"
import { Island } from "../../../components/Island"
import type { ModalSelectAssetsPayload } from "../../../components/Modal/ModalSelectAssets"
import { SWAP_TOKEN_FLAGS } from "../../../constants/swap"
import { useModalStore } from "../../../providers/ModalStoreProvider"
import { ModalType } from "../../../stores/modalStore"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import type { SwappableToken } from "../../../types/swap"
import { compareAmounts } from "../../../utils/tokenUtils"
import {
  balanceSelector,
  transitBalanceSelector,
} from "../../machines/depositedBalanceMachine"
import type { intentStatusMachine } from "../../machines/intentStatusMachine"
import {
  type Context,
  SWAP_STRATEGIES,
  SWAP_STRATEGIES_ARRAY,
  type SwapStrategy,
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
  is1cs: boolean
}

export const SwapForm = ({
  isLoggedIn,
  renderHostAppLink,
  is1cs,
}: SwapFormProps) => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const {
    handleSubmit,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<SwapFormValues>()

  const swapUIActorRef = SwapUIMachineContext.useActorRef()
  const snapshot = SwapUIMachineContext.useSelector((snapshot) => snapshot)
  const intentCreationResult = snapshot.context.intentCreationResult
  const slippageBasisPoints = snapshot.context.slippageBasisPoints
  const { data: tokensUsdPriceData } = useTokensUsdPrices()

  const {
    tokenIn,
    tokenOut,
    noLiquidity,
    insufficientTokenInAmount,
    failedToGetAQuote,
    quote1csError,
  } = SwapUIMachineContext.useSelector((snapshot) => {
    const tokenIn = snapshot.context.formValues.tokenIn
    const tokenOut = snapshot.context.formValues.tokenOut
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
      tokenIn,
      tokenOut,
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

  const swapStrategyParam = searchParams.get("swapStrategy")
  const swapStrategy =
    swapStrategyParam &&
    SWAP_STRATEGIES_ARRAY.includes(swapStrategyParam as SwapStrategy)
      ? (swapStrategyParam as SwapStrategy)
      : SWAP_STRATEGIES_ARRAY[0]

  const setSwapStrategy = useCallback(
    (newStrategy: SwapStrategy) => {
      const params = new URLSearchParams(searchParams.toString())
      if (newStrategy === "BEST") {
        params.delete("swapStrategy")
      } else {
        params.set("swapStrategy", newStrategy)
      }
      router.replace(`?${params.toString()}`, { scroll: false })
      swapUIActorRef.send({
        type: "input",
        params: { swapStrategy: newStrategy },
      })
    },
    [searchParams, router, swapUIActorRef.send]
  )

  const setSlippageBasisPoints = useCallback(
    (newSlippageBasisPoints: number) => {
      swapUIActorRef.send({
        type: "input",
        params: { slippageBasisPoints: newSlippageBasisPoints },
      })
    },
    [swapUIActorRef.send]
  )

  const {
    setModalType,
    payload,
    modalType: currentModalType,
  } = useModalStore((state) => state)

  const openModalSelectAssets = (
    fieldName: string,
    token: SwappableToken | undefined
  ) => {
    setModalType(ModalType.MODAL_SELECT_ASSETS, {
      ...(payload as ModalSelectAssetsPayload),
      fieldName,
      [fieldName]: token,
      isHoldingsEnabled: true,
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
          if (tokenOut === token) {
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
          if (tokenIn === token) {
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
    getValues().amountIn,
    tokenIn,
    tokensUsdPriceData
  )
  const usdAmountOut = getTokenUsdPrice(
    getValues().amountOut,
    tokenOut,
    tokensUsdPriceData
  )

  const isLoading =
    snapshot.matches({ editing: "waiting_quote" }) ||
    snapshot.context.is1csFetching

  return (
    <Island className="widget-container flex flex-col gap-5">
      <TradeNavigationLinks
        currentRoute="swap"
        renderHostAppLink={renderHostAppLink}
      />

      <div className="flex flex-col">
        <Form<SwapFormValues>
          handleSubmit={handleSubmit(onSubmit)}
          register={register}
        >
          <FieldComboInput<SwapFormValues>
            fieldName="amountIn"
            selected={tokenIn}
            handleSelect={() => {
              openModalSelectAssets(SWAP_TOKEN_FLAGS.IN, tokenIn)
            }}
            className="border border-gray-4 rounded-t-xl"
            required
            errors={errors}
            usdAmount={
              usdAmountIn !== null && usdAmountIn > 0
                ? `~${formatUsdAmount(usdAmountIn)}`
                : null
            }
            balance={tokenInBalance}
            transitBalance={tokenInTransitBalance ?? undefined}
          />

          <div className="relative w-full">
            <ButtonSwitch onClick={switchTokens} />
          </div>

          <FieldComboInput<SwapFormValues>
            fieldName="amountOut"
            selected={tokenOut}
            handleSelect={() => {
              openModalSelectAssets(SWAP_TOKEN_FLAGS.OUT, tokenOut)
            }}
            className="border border-gray-4 rounded-b-xl mb-5"
            errors={errors}
            disabled={true}
            isLoading={isLoading}
            usdAmount={
              usdAmountOut !== null && usdAmountOut > 0 && !isLoading
                ? `~${formatUsdAmount(usdAmountOut)}`
                : null
            }
            balance={tokenOutBalance}
          />

          {is1cs && (
            <Settings
              swapStrategy={swapStrategy}
              setSwapStrategy={setSwapStrategy}
              slippageBasisPoints={slippageBasisPoints}
              setSlippageBasisPoints={setSlippageBasisPoints}
            />
          )}

          {quote1csError && (
            <div className="mb-5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
              <p className="font-medium">Error:</p>
              <p>{quote1csError}</p>
            </div>
          )}

          <Flex align="stretch" direction="column">
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
          </Flex>

          <div className="mt-5">
            <SwapPriceImpact
              amountIn={usdAmountIn}
              amountOut={isLoading ? null : usdAmountOut}
            />
          </div>
          <SwapRateInfo tokenIn={tokenIn} tokenOut={tokenOut} />
        </Form>
        {renderIntentCreationResult(intentCreationResult)}
        {snapshot.context.intentRefs.length > 0 && (
          <Box>
            <Intents intentRefs={snapshot.context.intentRefs} />
          </Box>
        )}
      </div>
    </Island>
  )
}

function Intents({
  intentRefs,
}: { intentRefs: ActorRefFrom<typeof intentStatusMachine>[] }) {
  return (
    <div>
      {intentRefs.map((intentRef) => {
        return (
          <Fragment key={intentRef.id}>
            <SwapIntentCard intentStatusActorRef={intentRef} />
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

function Settings({
  swapStrategy,
  setSwapStrategy,
  slippageBasisPoints,
  setSlippageBasisPoints,
}: {
  swapStrategy: SwapStrategy
  setSwapStrategy: (swapStrategy: SwapStrategy) => void
  slippageBasisPoints: number
  setSlippageBasisPoints: (slippageBasisPoints: number) => void
}) {
  const slippagePercentage = slippageBasisPoints / 10000
  const slippagePercentageValue = (100 - slippagePercentage).toFixed(1)

  const handleSlippageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = Number.parseFloat(event.target.value)
    const basisPoints = Math.round((100 - percentage) * 10000)
    setSlippageBasisPoints(basisPoints)
  }

  return (
    <Accordion.Root type="single" collapsible className="mb-5">
      <Accordion.Item
        value="settings"
        className="border border-gray-4 rounded-lg"
      >
        <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-11 hover:bg-gray-2 transition-colors rounded-lg data-[state=open]:rounded-b-none">
          <span>Swap Settings</span>
          <CaretDownIcon className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
        </Accordion.Trigger>
        <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="slippage"
                className="text-xs font-medium text-gray-11"
              >
                Price Protection: {slippagePercentage}% slippage
              </label>
              <input
                id="slippage"
                type="range"
                min="0"
                max="99.5"
                step="0.1"
                value={slippagePercentageValue}
                onChange={handleSlippageChange}
                className="w-full h-2 bg-gray-3 dark:bg-gray-5 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${slippagePercentageValue}%, #ef4444 ${slippagePercentageValue}%, #ef4444 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-10">
                <span>100%</span>
                <span>0.5%</span>
              </div>
              <p className="text-xs text-gray-10">
                Your transaction will revert if the price changes unfavorably by
                more than this slippage percentage.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="swapStrategy"
                className="text-xs font-medium text-gray-11"
              >
                Swap Strategy
              </label>
              <select
                id="swapStrategy"
                value={swapStrategy}
                onChange={(e) =>
                  setSwapStrategy(e.target.value as SwapStrategy)
                }
                className="w-full px-3 py-2 rounded-md bg-gray-1 dark:bg-gray-2 border border-gray-4 dark:border-gray-6 text-gray-12 dark:text-gray-11 text-sm"
              >
                {Object.entries(SWAP_STRATEGIES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-10">
                Choose the strategy for executing your swap.
              </p>
            </div>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}
