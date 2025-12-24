import { Flex } from "@radix-ui/themes"
import { useModalController } from "@src/components/DefuseSDK/hooks/useModalController"
import { useTokensUsdPrices } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import { ModalType } from "@src/components/DefuseSDK/stores/modalStore"
import { isSupportedChainName } from "@src/components/DefuseSDK/utils/blockchain"
import {
  formatTokenValue,
  formatUsdAmount,
} from "@src/components/DefuseSDK/utils/format"
import getTokenUsdPrice from "@src/components/DefuseSDK/utils/getTokenUsdPrice"
import {
  addAmounts,
  getTokenMaxDecimals,
  isMinAmountNotRequired,
  subtractAmounts,
} from "@src/components/DefuseSDK/utils/tokenUtils"
import { logger } from "@src/utils/logger"
import { useSelector } from "@xstate/react"
import { useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { AuthGate } from "../../../../components/AuthGate"
import { ButtonCustom } from "../../../../components/Button/ButtonCustom"
import { Form } from "../../../../components/Form"
import { FieldComboInput } from "../../../../components/Form/FieldComboInput"
import { Island } from "../../../../components/Island"
import { IslandHeader } from "../../../../components/IslandHeader"
import { nearClient } from "../../../../constants/nearClient"
import type {
  SupportedChainName,
  TokenInfo,
  TokenValue,
} from "../../../../types/base"
import type { WithdrawWidgetProps } from "../../../../types/withdraw"
import { parseUnits } from "../../../../utils/parse"
import IntentCreationResult from "../../../account/components/IntentCreationResult"
import {
  balanceSelector,
  transitBalanceSelector,
} from "../../../machines/depositedBalanceMachine"
import { getPOABridgeInfo } from "../../../machines/poaBridgeInfoActor"
import { usePublicKeyModalOpener } from "../../../swap/hooks/usePublicKeyModalOpener"
import { WithdrawUIMachineContext } from "../../WithdrawUIMachineContext"
import { isCexIncompatible } from "../../utils/cexCompatibility"
import { getMinWithdrawalHyperliquidAmount } from "../../utils/hyperliquid"
import {
  Intents,
  MinWithdrawalAmount,
  PreparationResult,
  ReceivedAmountAndFee,
  RecipientSubForm,
} from "./components"
import { AcknowledgementCheckbox } from "./components/AcknowledgementCheckbox/AcknowledgementCheckbox"
import { useMinWithdrawalAmountWithFeeEstimation } from "./hooks/useMinWithdrawalAmountWithFeeEstimation"
import {
  balancesSelector,
  isLiquidityUnavailableSelector,
  isUnsufficientTokenInAmount,
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
    state.context.preparationOutput
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

  const increaseAmount = (tokenValue: TokenValue) => {
    if (parsedAmountIn == null) return

    const newValue = addAmounts(parsedAmountIn, tokenValue)

    const newFormattedValue = formatTokenValue(
      newValue.amount,
      newValue.decimals
    )

    actorRef.send({
      type: "WITHDRAW_FORM.UPDATE_AMOUNT",
      params: { amount: newFormattedValue, parsedAmount: newValue },
    })
  }

  const decreaseAmount = (tokenValue: TokenValue) => {
    if (parsedAmountIn == null) return

    const newValue = subtractAmounts(parsedAmountIn, tokenValue)

    const newFormattedValue = formatTokenValue(
      newValue.amount,
      newValue.decimals
    )

    actorRef.send({
      type: "WITHDRAW_FORM.UPDATE_AMOUNT",
      params: { amount: newFormattedValue, parsedAmount: newValue },
    })
  }

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
            isLoading={
              state.matches({ editing: "preparation" }) &&
              state.context.preparationOutput == null
            }
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
            isLoading={
              state.matches({ editing: "preparation" }) &&
              state.context.preparationOutput == null
            }
          />

          <AuthGate
            renderHostAppLink={renderHostAppLink}
            shouldRender={isLoggedIn}
          >
            <ButtonCustom
              size="lg"
              disabled={state.matches("submitting") || noLiquidity}
              isLoading={state.matches("submitting")}
            >
              {getWithdrawButtonText(noLiquidity, insufficientTokenInAmount)}
            </ButtonCustom>
          </AuthGate>
        </Flex>
      </Form>

      <PreparationResult
        preparationOutput={state.context.preparationOutput}
        increaseAmount={increaseAmount}
        decreaseAmount={decreaseAmount}
      />

      <IntentCreationResult intentCreationResult={intentCreationResult} />

      {intentRefs.length !== 0 && <Intents intentRefs={intentRefs} />}
    </Island>
  )
}
