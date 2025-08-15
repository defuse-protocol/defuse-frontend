import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Box, Callout, Flex } from "@radix-ui/themes"
import type { ModalSelectAssetsPayload } from "@src/components/DefuseSDK/components/Modal/ModalSelectAssets"
import { TradeNavigationLinks } from "@src/components/DefuseSDK/components/TradeNavigationLinks"
import { useTokensUsdPrices } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import { formatUsdAmount } from "@src/components/DefuseSDK/utils/format"
import getTokenUsdPrice from "@src/components/DefuseSDK/utils/getTokenUsdPrice"
import { useSelector } from "@xstate/react"
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
import type { Context } from "../../machines/swapUIMachine1Click"
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
    handleSubmit,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<SwapFormValues>()

  const swapUIActorRef = SwapUIMachineContext.useActorRef()
  const snapshot = SwapUIMachineContext.useSelector((snapshot) => snapshot)
  const intentCreationResult = snapshot.context.intentCreationResult
  const { data: tokensUsdPriceData } = useTokensUsdPrices()

  const { tokenIn, tokenOut } = SwapUIMachineContext.useSelector((snapshot) => {
    const tokenIn = snapshot.context.formValues.tokenIn
    const tokenOut = snapshot.context.formValues.tokenOut

    return {
      tokenIn,
      tokenOut,
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

  const { setModalType, payload } = useModalStore((state) => state)

  const openModalSelectAssets = (
    fieldName: string,
    token: SwappableToken | undefined
  ) => {
    setModalType(ModalType.MODAL_SELECT_ASSETS, {
      ...(payload as ModalSelectAssetsPayload),
      fieldName,
      [fieldName]: token,
      balances: depositedBalanceRef?.getSnapshot().context.balances,
    })
  }

  useEffect(() => {
    if (
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
  }, [payload, swapUIActorRef])

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
            isLoading={snapshot.matches({ editing: "waiting_quote" })}
            usdAmount={
              usdAmountOut !== null && usdAmountOut > 0
                ? `~${formatUsdAmount(usdAmountOut)}`
                : null
            }
            balance={tokenOutBalance}
          />

          <Flex align="stretch" direction="column">
            <AuthGate
              renderHostAppLink={renderHostAppLink}
              shouldRender={isLoggedIn}
            >
              <ButtonCustom
                type="submit"
                size="lg"
                fullWidth
                isLoading={snapshot.matches("submitting")}
                disabled={balanceInsufficient}
              >
                {renderSwapButtonText(balanceInsufficient)}
              </ButtonCustom>
            </AuthGate>
          </Flex>

          <div className="mt-5">
            <SwapPriceImpact amountIn={usdAmountIn} amountOut={usdAmountOut} />
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

function renderSwapButtonText(balanceInsufficient: boolean) {
  if (balanceInsufficient) return "Insufficient Balance"
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
