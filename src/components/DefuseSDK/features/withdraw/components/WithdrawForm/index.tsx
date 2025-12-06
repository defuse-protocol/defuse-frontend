import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { SlidersHorizontalIcon } from "@phosphor-icons/react"
import { Flex } from "@radix-ui/themes"
import { useModalController } from "@src/components/DefuseSDK/hooks/useModalController"
import { useTokensUsdPrices } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import { useModalStore } from "@src/components/DefuseSDK/providers/ModalStoreProvider"
import { ModalType } from "@src/components/DefuseSDK/stores/modalStore"
import { isSupportedChainName } from "@src/components/DefuseSDK/utils/blockchain"
import {
  formatTokenValue,
  formatUsdAmount,
} from "@src/components/DefuseSDK/utils/format"
import getTokenUsdPrice from "@src/components/DefuseSDK/utils/getTokenUsdPrice"
import { BASIS_POINTS_DENOMINATOR } from "@src/components/DefuseSDK/utils/tokenUtils"
import {
  getTokenMaxDecimals,
  isMinAmountNotRequired,
} from "@src/components/DefuseSDK/utils/tokenUtils"
import { logger } from "@src/utils/logger"
import { useSelector } from "@xstate/react"
import { type ReactNode, useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { AuthGate } from "../../../../components/AuthGate"
import { ButtonCustom } from "../../../../components/Button/ButtonCustom"
import { Form } from "../../../../components/Form"
import { FieldComboInput } from "../../../../components/Form/FieldComboInput"
import { Island } from "../../../../components/Island"
import { IslandHeader } from "../../../../components/IslandHeader"
import { PriceChangeDialog } from "../../../../components/PriceChangeDialog"
import { nearClient } from "../../../../constants/nearClient"
import type {
  SupportedChainName,
  TokenInfo,
  TokenValue,
} from "../../../../types/base"
import type { WithdrawWidgetProps } from "../../../../types/withdraw"
import { parseUnits } from "../../../../utils/parse"
import {
  balanceSelector,
  transitBalanceSelector,
} from "../../../machines/depositedBalanceMachine"
import { getPOABridgeInfo } from "../../../machines/poaBridgeInfoActor"
import type { Output as WithdrawIntent1csMachineOutput } from "../../../machines/withdrawIntent1csMachine"
import { usePublicKeyModalOpener } from "../../../swap/hooks/usePublicKeyModalOpener"
import { WithdrawUIMachineContext } from "../../WithdrawUIMachineContext"
import { isCexIncompatible } from "../../utils/cexCompatibility"
import { getMinWithdrawalHyperliquidAmount } from "../../utils/hyperliquid"
import {
  Intents,
  MinWithdrawalAmount,
  ReceivedAmountAndFee,
  RecipientSubForm,
} from "./components"
import { AcknowledgementCheckbox } from "./components/AcknowledgementCheckbox/AcknowledgementCheckbox"
import { useMinWithdrawalAmountWithFeeEstimation } from "./hooks/useMinWithdrawalAmountWithFeeEstimation"
import {
  balancesSelector,
  is1csQuoteLoadingSelector,
  isLiquidityUnavailableSelector,
  isUnsufficientTokenInAmount,
  quote1csErrorSelector,
  slippageBasisPointsSelector,
  totalAmountReceivedSelector,
  withdtrawalFeeSelector,
} from "./selectors"
import { getWithdrawButtonText, isNearIntentsNetwork } from "./utils"

export type WithdrawFormNearValues = {
  amountIn: string
  recipient: string
  blockchain: SupportedChainName | "near_intents"
  destinationMemo?: string
  isFundsLooseConfirmed?: boolean
}

type WithdrawFormProps = WithdrawWidgetProps

export const WithdrawForm = ({
  userAddress,
  displayAddress,
  chainType,
  presetAmount,
  presetNetwork,
  presetRecipient,
  sendNearTransaction,
  renderHostAppLink,
}: WithdrawFormProps) => {
  const isLoggedIn = userAddress != null
  const actorRef = WithdrawUIMachineContext.useActorRef()
  const {
    state,
    formRef,
    swapRef,
    depositedBalanceRef,
    poaBridgeInfoRef,
    intentCreationResult,
    intentRefs,
    noLiquidity,
    insufficientTokenInAmount,
    totalAmountReceived,
    withdtrawalFee,
    is1csQuoteLoading,
    quote1csError,
    slippageBasisPoints,
    quote1cs,
    priceChangeDialog,
  } = WithdrawUIMachineContext.useSelector((state) => {
    return {
      state,
      formRef: state.context.withdrawFormRef,
      swapRef: state.children.swapRef,
      depositedBalanceRef: state.context.depositedBalanceRef,
      poaBridgeInfoRef: state.context.poaBridgeInfoRef,
      intentCreationResult: state.context.intentCreationResult,
      intentRefs: state.context.intentRefs,
      noLiquidity: isLiquidityUnavailableSelector(state),
      insufficientTokenInAmount: isUnsufficientTokenInAmount(state),
      totalAmountReceived: totalAmountReceivedSelector(state),
      withdtrawalFee: withdtrawalFeeSelector(state),
      balances: balancesSelector(state),
      is1csQuoteLoading: is1csQuoteLoadingSelector(state),
      quote1csError: quote1csErrorSelector(state),
      slippageBasisPoints: slippageBasisPointsSelector(state),
      quote1cs: state.context.quote1cs,
      priceChangeDialog: state.context.priceChangeDialog,
    }
  })
  const publicKeyVerifierRef = useSelector(swapRef, (state) => {
    if (state) {
      return state.children.publicKeyVerifierRef
    }
  })

  // biome-ignore lint/suspicious/noExplicitAny: types should've been correct, but `publicKeyVerifierRef` is commented out
  usePublicKeyModalOpener(publicKeyVerifierRef as any, sendNearTransaction)

  useEffect(() => {
    if (userAddress != null && chainType != null) {
      actorRef.send({
        type: "LOGIN",
        params: { userAddress, userChainType: chainType },
      })
    } else {
      actorRef.send({
        type: "LOGOUT",
      })
    }
  }, [userAddress, actorRef, chainType])

  const {
    token,
    tokenOut,
    tokenOutDeployment,
    parsedAmountIn,
    amountIn,
    recipient,
    blockchain,
    cexFundsLooseConfirmation,
  } = useSelector(formRef, (state) => {
    return {
      token: state.context.tokenIn,
      tokenOut: state.context.tokenOut,
      tokenOutDeployment: state.context.tokenOutDeployment,
      parsedAmountIn: state.context.parsedAmount,
      amountIn: state.context.amount,
      recipient: state.context.recipient,
      blockchain: state.context.blockchain,
      cexFundsLooseConfirmation: state.context.cexFundsLooseConfirmation,
    }
  })

  const form = useForm<WithdrawFormNearValues>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    values: {
      amountIn,
      recipient,
      blockchain,
      isFundsLooseConfirmed: cexFundsLooseConfirmation === "confirmed",
    },
    // `resetOptions` is needed exclusively for being able to use `values` option without bugs
    resetOptions: {
      // Fixes: prevent all errors from being cleared when `values` change
      keepErrors: true,
      // Fixes: `reValidateMode` is not working when `values` change
      keepIsSubmitted: true,
    },
  })
  const {
    handleSubmit,
    register,
    control,
    watch,
    formState: { errors },
    setValue,
    getValues,
  } = form

  const minWithdrawalPOABridgeAmount = useSelector(
    poaBridgeInfoRef,
    (state) => {
      const bridgedTokenInfo = getPOABridgeInfo(state, tokenOut.defuseAssetId)
      return bridgedTokenInfo == null
        ? null
        : {
            amount: bridgedTokenInfo.minWithdrawal,
            decimals: tokenOut.decimals,
          }
    }
  )
  const minWithdrawalHyperliquidAmount = getMinWithdrawalHyperliquidAmount(
    blockchain,
    token
  )
  const minWithdrawalAmount = isNearIntentsNetwork(blockchain)
    ? null
    : chainType != null && isMinAmountNotRequired(chainType, blockchain)
      ? null
      : (minWithdrawalHyperliquidAmount ?? minWithdrawalPOABridgeAmount)

  const minWithdrawalAmountWithFee = useMinWithdrawalAmountWithFeeEstimation(
    parsedAmountIn,
    minWithdrawalAmount,
    null // 1cs flow doesn't use preparationOutput
  )

  const tokenInBalance = useSelector(
    depositedBalanceRef,
    balanceSelector(token)
  )

  const tokenInTransitBalance = useSelector(
    depositedBalanceRef,
    transitBalanceSelector(token)
  )

  const { data: tokensUsdPriceData } = useTokensUsdPrices()

  const { setModalType, data: modalSelectAssetsData } = useModalController<{
    modalType: ModalType
    token: TokenInfo | undefined
  }>(ModalType.MODAL_SELECT_ASSETS)

  const { setModalType: setSlippageModalType } = useModalStore((state) => state)

  const handleOpenSlippageSettings = useCallback(() => {
    const tokenDeltas =
      quote1cs != null && quote1cs.tag === "ok"
        ? quote1cs.value.tokenDeltas
        : null

    setSlippageModalType(ModalType.MODAL_SLIPPAGE_SETTINGS, {
      modalType: ModalType.MODAL_SLIPPAGE_SETTINGS,
      actorRef,
      currentSlippage: slippageBasisPoints,
      tokenDeltas,
      tokenOut,
      tokenIn: token,
    })
  }, [
    setSlippageModalType,
    actorRef,
    slippageBasisPoints,
    quote1cs,
    tokenOut,
    token,
  ])

  const handleSelect = useCallback(() => {
    const fieldName = "token"
    setModalType(ModalType.MODAL_SELECT_ASSETS, {
      fieldName,
      [fieldName]: token,
      isHoldingsEnabled: true,
    })
  }, [token, setModalType])

  useEffect(() => {
    const sub = watch(async (value, { name }) => {
      if (name === "amountIn") {
        const amount = value[name] ?? ""
        let parsedAmount: TokenValue | null = null
        try {
          const decimals = getTokenMaxDecimals(token)
          parsedAmount = {
            amount: parseUnits(amount, decimals),
            decimals: decimals,
          }
        } catch {}

        actorRef.send({
          type: "WITHDRAW_FORM.UPDATE_AMOUNT",
          params: { amount, parsedAmount },
        })
      }
      if (name === "destinationMemo") {
        actorRef.send({
          type: "WITHDRAW_FORM.UPDATE_DESTINATION_MEMO",
          params: { destinationMemo: value[name] ?? "" },
        })
      }
      if (name === "isFundsLooseConfirmed") {
        actorRef.send({
          type: "WITHDRAW_FORM.CEX_FUNDS_LOOSE_CHANGED",
          params: {
            cexFundsLooseConfirmation: value[name]
              ? "confirmed"
              : "not_confirmed",
          },
        })
      }
    })
    return () => {
      sub.unsubscribe()
    }
  }, [watch, actorRef, token])

  useEffect(() => {
    if (presetAmount != null) {
      setValue("amountIn", presetAmount)
    }
    if (presetNetwork != null && isSupportedChainName(presetNetwork)) {
      setValue("blockchain", presetNetwork)
    }
    if (presetRecipient != null) {
      setValue("recipient", presetRecipient)
    }
  }, [presetAmount, presetNetwork, presetRecipient, setValue])

  useEffect(() => {
    const sub = actorRef.on("INTENT_PUBLISHED", () => {
      setValue("amountIn", "")
    })

    return () => {
      sub.unsubscribe()
    }
  }, [actorRef, setValue])

  const tokenToWithdrawUsdAmount = getTokenUsdPrice(
    getValues().amountIn,
    token,
    tokensUsdPriceData
  )
  const receivedAmountUsd = totalAmountReceived?.amount
    ? getTokenUsdPrice(
        formatTokenValue(
          totalAmountReceived.amount,
          totalAmountReceived.decimals
        ),
        tokenOut,
        tokensUsdPriceData
      )
    : null
  const feeUsd = withdtrawalFee
    ? getTokenUsdPrice(
        formatTokenValue(withdtrawalFee.amount, withdtrawalFee.decimals),
        tokenOut,
        tokensUsdPriceData
      )
    : null

  /**
   * This is ModalSelectAssets "callback"
   */
  useEffect(() => {
    if (modalSelectAssetsData?.token) {
      const token = modalSelectAssetsData.token
      modalSelectAssetsData.token = undefined // consume data, so it won't be triggered again
      const parsedAmount = {
        amount: 0n,
        decimals: getTokenMaxDecimals(token),
      }
      try {
        parsedAmount.amount = parseUnits(amountIn, parsedAmount.decimals)
      } catch {}
      actorRef.send({
        type: "WITHDRAW_FORM.UPDATE_TOKEN",
        params: {
          token: token,
          parsedAmount: parsedAmount,
        },
      })
    }
  }, [modalSelectAssetsData, actorRef, amountIn])

  return (
    <Island className="widget-container flex flex-col gap-4">
      <IslandHeader heading="Withdraw" condensed />

      <Form<WithdrawFormNearValues>
        handleSubmit={handleSubmit(() => {
          if (userAddress == null || chainType == null) {
            logger.warn("No user address provided")
            return
          }

          actorRef.send({
            type: "submit",
            params: {
              userAddress,
              userChainType: chainType,
              nearClient,
            },
          })
        })}
        register={register}
      >
        <Flex direction="column" gap="5">
          <FieldComboInput<WithdrawFormNearValues>
            fieldName="amountIn"
            dataTestId="withdraw-form-amount-in"
            selected={token}
            tokenIn={token}
            handleSelect={handleSelect}
            className="border border-gray-4 rounded-xl"
            required
            min={
              minWithdrawalAmount != null
                ? {
                    value: formatTokenValue(
                      minWithdrawalAmount.amount,
                      minWithdrawalAmount.decimals
                    ),
                    message: "Amount is too low",
                  }
                : undefined
            }
            max={
              tokenInBalance != null
                ? {
                    value: formatTokenValue(
                      tokenInBalance.amount,
                      tokenInBalance.decimals
                    ),
                    message: "Insufficient balance",
                  }
                : undefined
            }
            errors={errors}
            balance={tokenInBalance}
            transitBalance={tokenInTransitBalance}
            register={register}
            usdAmount={
              tokenToWithdrawUsdAmount !== null && tokenToWithdrawUsdAmount > 0
                ? `~${formatUsdAmount(tokenToWithdrawUsdAmount)}`
                : null
            }
          />

          <MinWithdrawalAmount
            minWithdrawalAmount={minWithdrawalAmountWithFee}
            tokenOut={tokenOut}
            isLoading={is1csQuoteLoading}
          />

          <RecipientSubForm
            form={form}
            chainType={chainType}
            userAddress={userAddress}
            displayAddress={displayAddress}
            tokenInBalance={tokenInBalance}
          />

          {!isNearIntentsNetwork(blockchain) &&
            isCexIncompatible(tokenOutDeployment) && (
              <AcknowledgementCheckbox
                control={control}
                errors={errors}
                tokenOut={tokenOut}
              />
            )}

          <ReceivedAmountAndFee
            fee={withdtrawalFee}
            totalAmountReceived={totalAmountReceived}
            feeUsd={feeUsd}
            totalAmountReceivedUsd={receivedAmountUsd}
            symbol={token.symbol}
            isLoading={is1csQuoteLoading}
          />

          {!isNearIntentsNetwork(blockchain) && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleOpenSlippageSettings}
                className="px-3 py-1.5 rounded-md border transition-all bg-gray-1 border-gray-6 hover:bg-gray-3 hover:border-gray-7 text-label font-medium text-xs cursor-pointer active:scale-[0.98] flex items-center gap-1.5"
              >
                <span>
                  Max slippage:{" "}
                  {Intl.NumberFormat(undefined, {
                    style: "percent",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(
                    slippageBasisPoints / Number(BASIS_POINTS_DENOMINATOR)
                  )}
                </span>
                <SlidersHorizontalIcon className="size-3.5" weight="regular" />
              </button>
            </div>
          )}

          {quote1csError && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
              <p className="font-medium">Error:</p>
              <p>{quote1csError}</p>
            </div>
          )}

          <AuthGate
            renderHostAppLink={renderHostAppLink}
            shouldRender={isLoggedIn}
          >
            <ButtonCustom
              size="lg"
              disabled={
                state.matches("submitting_1cs") ||
                is1csQuoteLoading ||
                noLiquidity ||
                insufficientTokenInAmount
              }
              isLoading={state.matches("submitting_1cs")}
            >
              {getWithdrawButtonText(noLiquidity, insufficientTokenInAmount)}
            </ButtonCustom>
          </AuthGate>
        </Flex>
      </Form>

      {renderWithdrawIntentCreationResult(intentCreationResult)}

      {intentRefs.length !== 0 && <Intents intentRefs={intentRefs} />}

      {priceChangeDialog && (
        <PriceChangeDialog
          open={true}
          tokenIn={token}
          tokenOut={tokenOut}
          amountIn={{
            amount: parsedAmountIn?.amount ?? 0n,
            decimals: parsedAmountIn?.decimals ?? 0,
          }}
          amountOut={{
            amount: totalAmountReceived?.amount ?? 0n,
            decimals: totalAmountReceived?.decimals ?? 0,
          }}
          previousOppositeAmount={priceChangeDialog.previousOppositeAmount}
          newOppositeAmount={priceChangeDialog.pendingNewOppositeAmount}
          swapType={QuoteRequest.swapType.EXACT_INPUT}
          onConfirm={() => actorRef.send({ type: "PRICE_CHANGE_CONFIRMED" })}
          onCancel={() => actorRef.send({ type: "PRICE_CHANGE_CANCELLED" })}
        />
      )}
    </Island>
  )
}

function renderWithdrawIntentCreationResult(
  intentCreationResult: WithdrawIntent1csMachineOutput | null
): ReactNode {
  if (!intentCreationResult || intentCreationResult.tag === "ok") {
    return null
  }

  let content: ReactNode = null

  const status = intentCreationResult.value.reason
  switch (status) {
    case "ERR_USER_DIDNT_SIGN":
      content =
        "It seems the message wasn't signed in your wallet. Please try again."
      break

    case "ERR_CANNOT_VERIFY_SIGNATURE":
      content =
        "We couldn't verify your signature, please try again with another wallet."
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
        "We couldn't verify your key, possibly due to a connection issue."
      break

    case "ERR_PUBKEY_ADDING_FAILED":
      content = "Transaction for adding public key is failed. Please try again."
      break

    case "ERR_PUBKEY_EXCEPTION":
      content = "An error occurred while adding public key. Please try again."
      break

    case "ERR_1CS_QUOTE_FAILED":
      content = "Failed to get a quote. Please try again."
      break

    case "ERR_NO_DEPOSIT_ADDRESS":
      content = "No deposit address available. Please try again."
      break

    case "ERR_TRANSFER_MESSAGE_FAILED":
      content = "Failed to create transfer message. Please try again."
      break

    case "ERR_CANNOT_PUBLISH_INTENT":
      content =
        "server_reason" in intentCreationResult.value
          ? `Failed to publish intent: ${intentCreationResult.value.server_reason}`
          : "Failed to publish intent. Please try again."
      break

    case "ERR_AMOUNT_IN_BALANCE_INSUFFICIENT_AFTER_NEW_1CS_QUOTE":
      content = "Insufficient balance after price change. Please try again."
      break

    default:
      content = `An error occurred: ${status}. Please try again.`
  }

  if (!content) {
    return null
  }

  return (
    <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-4">
      <p className="text-amber-800 dark:text-amber-200">{content}</p>
    </div>
  )
}
