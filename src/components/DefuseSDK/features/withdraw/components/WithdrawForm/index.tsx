import { Checkbox, Flex, Text, Tooltip } from "@radix-ui/themes"
import { useModalController } from "@src/components/DefuseSDK/hooks/useModalController"
import { useTokensUsdPrices } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import { useTokensStore } from "@src/components/DefuseSDK/providers/TokensStoreProvider"
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
import { useSelector } from "@xstate/react"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { AuthGate } from "../../../../components/AuthGate"
import { ButtonCustom } from "../../../../components/Button/ButtonCustom"
import { Form } from "../../../../components/Form"
import { FieldComboInput } from "../../../../components/Form/FieldComboInput"
import { Island } from "../../../../components/Island"
import { IslandHeader } from "../../../../components/IslandHeader"
import { nearClient } from "../../../../constants/nearClient"
import { logger } from "../../../../logger"
import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenValue,
  UnifiedTokenInfo,
} from "../../../../types/base"
import type { WithdrawWidgetProps } from "../../../../types/withdraw"
import { parseUnits } from "../../../../utils/parse"
import {
  balanceSelector,
  transitBalanceSelector,
} from "../../../machines/depositedBalanceMachine"
import { getPOABridgeInfo } from "../../../machines/poaBridgeInfoActor"
import { renderIntentCreationResult } from "../../../swap/components/SwapForm"
import { usePublicKeyModalOpener } from "../../../swap/hooks/usePublicKeyModalOpener"
import { WithdrawUIMachineContext } from "../../WithdrawUIMachineContext"
import { isCexIncompatible } from "../../utils/cexCompatibility"
import { getMinWithdrawalHiperliquidAmount } from "../../utils/hyperliquid"
import {
  Intents,
  MinWithdrawalAmount,
  PreparationResult,
  ReceivedAmountAndFee,
  RecipientSubForm,
} from "./components"
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
  tokenList,
  presetAmount,
  presetNetwork,
  presetRecipient,
  sendNearTransaction,
  renderHostAppLink,
  holdings,
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
    parsedAmountIn,
    amountIn,
    recipient,
    blockchain,
    cexFundsLooseConfirmation,
  } = useSelector(formRef, (state) => {
    return {
      token: state.context.tokenIn,
      tokenOut: state.context.tokenOut,
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
      const bridgedTokenInfo = getPOABridgeInfo(state, tokenOut)
      return bridgedTokenInfo == null
        ? null
        : {
            amount: bridgedTokenInfo.minWithdrawal,
            decimals: tokenOut.decimals,
          }
    }
  )
  const minWithdrawalHyperliquidAmount = getMinWithdrawalHiperliquidAmount(
    blockchain,
    tokenOut
  )
  const minWithdrawalAmount = isNearIntentsNetwork(blockchain)
    ? null
    : chainType != null && isMinAmountNotRequired(chainType, blockchain)
      ? null
      : (minWithdrawalHyperliquidAmount ?? minWithdrawalPOABridgeAmount)

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
    token: BaseTokenInfo | UnifiedTokenInfo | undefined
  }>(ModalType.MODAL_SELECT_ASSETS)

  const updateTokens = useTokensStore((state) => state.updateTokens)

  const handleSelect = () => {
    updateTokens(tokenList)
    const fieldName = "token"
    setModalType(ModalType.MODAL_SELECT_ASSETS, {
      fieldName,
      [fieldName]: token,
      balances: depositedBalanceRef?.getSnapshot().context.balances,
      holdings,
    })
  }

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
            selected={token}
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
            minWithdrawalAmount={minWithdrawalAmount}
            tokenOut={tokenOut}
          />

          <RecipientSubForm
            form={form}
            chainType={chainType}
            userAddress={userAddress}
            displayAddress={displayAddress}
            tokenInBalance={tokenInBalance}
          />

          {!isNearIntentsNetwork(blockchain) && isCexIncompatible(tokenOut) && (
            <Text
              as="label"
              size="1"
              weight="medium"
              color={errors.isFundsLooseConfirmed ? "red" : "gray"}
            >
              <Flex as="span" gap="2">
                <Controller
                  control={control}
                  name="isFundsLooseConfirmed"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Checkbox
                      size="3"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                I understand CEX addresses may cause fund loss or issues.
                <Tooltip
                  side="bottom"
                  align="center"
                  maxWidth="300px"
                  content="Many centralized exchanges (CEXs) don’t support third-party protocol withdrawals. Using a CEX address may result in lost or delayed funds. Use a self-custodial wallet instead."
                >
                  <Text
                    size="1"
                    color="gray"
                    as="span"
                    style={{
                      textDecoration: "underline",
                      textDecorationStyle: "dotted",
                    }}
                  >
                    Why?
                  </Text>
                </Tooltip>
              </Flex>
            </Text>
          )}

          <ReceivedAmountAndFee
            fee={withdtrawalFee}
            totalAmountReceived={totalAmountReceived}
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
      {renderIntentCreationResult(intentCreationResult)}

      {intentRefs.length !== 0 && <Intents intentRefs={intentRefs} />}
    </Island>
  )
}
