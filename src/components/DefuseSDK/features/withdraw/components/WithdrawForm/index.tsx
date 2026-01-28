import type { Contact } from "@src/app/(app)/(auth)/contacts/actions"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import ModalReviewSend from "@src/components/DefuseSDK/components/Modal/ModalReviewSend"
import { SelectTriggerLike } from "@src/components/DefuseSDK/components/Select/SelectTriggerLike"
import TooltipNew from "@src/components/DefuseSDK/components/TooltipNew"
import { useModalController } from "@src/components/DefuseSDK/hooks/useModalController"
import { useTokensUsdPrices } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import { ModalType } from "@src/components/DefuseSDK/stores/modalStore"
import { isSupportedChainName } from "@src/components/DefuseSDK/utils/blockchain"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import getTokenUsdPrice from "@src/components/DefuseSDK/utils/getTokenUsdPrice"
import { isBaseToken } from "@src/components/DefuseSDK/utils/token"
import {
  addAmounts,
  compareAmounts,
  computeTotalBalanceDifferentDecimals,
  getTokenMaxDecimals,
  isMinAmountNotRequired,
  subtractAmounts,
} from "@src/components/DefuseSDK/utils/tokenUtils"
import Spinner from "@src/components/Spinner"
import TokenIconPlaceholder from "@src/components/TokenIconPlaceholder"
import { useWithdrawTrackerMachine } from "@src/providers/WithdrawTrackerMachineProvider"
import { logger } from "@src/utils/logger"
import { useSelector } from "@xstate/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { formatUnits } from "viem"
import { AuthGate } from "../../../../components/AuthGate"
import { nearClient } from "../../../../constants/nearClient"
import type {
  SupportedChainName,
  TokenInfo,
  TokenValue,
} from "../../../../types/base"
import type { WithdrawWidgetProps } from "../../../../types/withdraw"
import { parseUnits } from "../../../../utils/parse"
import SelectedTokenInput from "../../../deposit/components/DepositForm/SelectedTokenInput"
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
  MinWithdrawalAmount,
  PreparationResult,
  RecipientSubForm,
} from "./components"
import { AcknowledgementCheckbox } from "./components/AcknowledgementCheckbox/AcknowledgementCheckbox"
import { useMinWithdrawalAmountWithFeeEstimation } from "./hooks/useMinWithdrawalAmountWithFeeEstimation"
import {
  balancesSelector,
  directionFeeSelector,
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

type WithdrawFormProps = WithdrawWidgetProps & {
  /** Network that was requested but has no compatible tokens */
  noTokenForPresetNetwork?: SupportedChainName | null
}

export const WithdrawForm = ({
  userAddress,
  displayAddress,
  chainType,
  presetAmount,
  presetNetwork,
  presetRecipient,
  presetContactId,
  noTokenForPresetNetwork,
  tokenList,
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
    noLiquidity,
    insufficientTokenInAmount,
    totalAmountReceived,
    withdtrawalFee,
    directionFee,
    balances,
  } = WithdrawUIMachineContext.useSelector((state) => {
    return {
      state,
      formRef: state.context.withdrawFormRef,
      swapRef: state.children.swapRef,
      depositedBalanceRef: state.context.depositedBalanceRef,
      poaBridgeInfoRef: state.context.poaBridgeInfoRef,
      intentCreationResult: state.context.intentCreationResult,
      noLiquidity: isLiquidityUnavailableSelector(state),
      insufficientTokenInAmount: isUnsufficientTokenInAmount(state),
      totalAmountReceived: totalAmountReceivedSelector(state),
      withdtrawalFee: withdtrawalFeeSelector(state),
      directionFee: directionFeeSelector(state),
      balances: balancesSelector(state),
    }
  })
  const publicKeyVerifierRef = useSelector(swapRef, (state) => {
    if (state) {
      return state.children.publicKeyVerifierRef
    }
  })

  const isReviewOpen =
    state.matches({ editing: "reviewing" }) || state.matches("submitting")

  const isPreparing =
    state.matches({ editing: "preparation" }) &&
    state.context.preparationOutput == null

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

  // Track selected contact for the review modal
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

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
      if (name === "recipient") {
        const recipientValue = value[name] ?? ""

        if (recipientValue) {
          actorRef.send({
            type: "WITHDRAW_FORM.RECIPIENT",
            params: { recipient: recipientValue, proxyRecipient: null },
          })
        }
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
    // Token selection for presetNetwork is handled in WithdrawWidget.
    // Here we just need to set the blockchain and recipient in the form/XState.
    if (presetNetwork != null && isSupportedChainName(presetNetwork)) {
      // Check if current token supports this network before updating
      // (WithdrawWidget should have already selected a compatible token)
      const tokenSupportsNetwork = isBaseToken(token)
        ? token.deployments.some((d) => d.chainName === presetNetwork)
        : token.groupedTokens.some((gt) =>
            gt.deployments.some((d) => d.chainName === presetNetwork)
          )

      if (tokenSupportsNetwork) {
        setValue("blockchain", presetNetwork)
        // Also update XState machine so form values stay in sync
        actorRef.send({
          type: "WITHDRAW_FORM.UPDATE_BLOCKCHAIN",
          params: { blockchain: presetNetwork },
        })
      }
    }
    if (presetRecipient != null) {
      setValue("recipient", presetRecipient)
      // Also update XState machine (must be after blockchain update since that clears recipient)
      actorRef.send({
        type: "WITHDRAW_FORM.RECIPIENT",
        params: { recipient: presetRecipient, proxyRecipient: null },
      })
    }
  }, [presetAmount, presetNetwork, presetRecipient, setValue, actorRef, token])

  // Track if we've already corrected the token for presetNetwork
  const hasAttemptedTokenCorrection = useRef(false)

  // When balances are loaded, check if we need to switch to a token with balance
  // This handles the case where WithdrawWidget selected a token by network compatibility
  // but that token has no balance - we want to switch to one with balance instead
  useEffect(() => {
    // Only run if we have a preset network and haven't already corrected
    if (
      presetNetwork == null ||
      !isSupportedChainName(presetNetwork) ||
      hasAttemptedTokenCorrection.current
    ) {
      return
    }

    // Wait until balances are loaded (non-empty)
    if (Object.keys(balances).length === 0) {
      return
    }

    // Check if current token has balance
    const currentTokenBalance = computeTotalBalanceDifferentDecimals(
      token,
      balances
    )
    if (currentTokenBalance != null && currentTokenBalance.amount > 0n) {
      // Current token has balance, no need to switch
      hasAttemptedTokenCorrection.current = true
      return
    }

    // Current token has no balance - find one that does and supports the preset network
    const tokenWithBalance = tokenList.find((t) => {
      // Check if token supports the network
      const supportsNetwork = isBaseToken(t)
        ? t.deployments.some((d) => d.chainName === presetNetwork)
        : t.groupedTokens.some((gt) =>
            gt.deployments.some((d) => d.chainName === presetNetwork)
          )

      if (!supportsNetwork) return false

      // Check if token has balance
      const balance = computeTotalBalanceDifferentDecimals(t, balances)
      return balance != null && balance.amount > 0n
    })

    hasAttemptedTokenCorrection.current = true

    if (tokenWithBalance != null) {
      // Switch to the token with balance
      const parsedAmount = {
        amount: 0n,
        decimals: getTokenMaxDecimals(tokenWithBalance),
      }
      actorRef.send({
        type: "WITHDRAW_FORM.UPDATE_TOKEN",
        params: {
          token: tokenWithBalance,
          parsedAmount: parsedAmount,
        },
      })
    }
  }, [presetNetwork, balances, token, tokenList, actorRef])

  const { registerWithdraw, hasActiveWithdraw } = useWithdrawTrackerMachine()

  useEffect(() => {
    const sub = actorRef.on("INTENT_PUBLISHED", () => {
      setValue("amountIn", "")

      const snapshot = actorRef.getSnapshot()
      const intentCreationResult = snapshot.context.intentCreationResult

      if (intentCreationResult?.tag === "ok") {
        const { intentHash, intentDescription } = intentCreationResult.value

        if (!hasActiveWithdraw(intentHash)) {
          registerWithdraw({
            intentHash,
            tokenIn: token,
            tokenOut,
            intentDescription,
          })
        }
      }
    })

    return () => {
      sub.unsubscribe()
    }
  }, [actorRef, setValue, token, tokenOut, registerWithdraw, hasActiveWithdraw])

  const tokenToWithdrawUsdAmount = getTokenUsdPrice(
    getValues().amountIn,
    token,
    tokensUsdPriceData
  )

  // Get the raw token price for USD toggle functionality
  const tokenPrice = (() => {
    if (!tokensUsdPriceData || !token) return null
    if (isBaseToken(token) && tokensUsdPriceData[token.defuseAssetId]) {
      return tokensUsdPriceData[token.defuseAssetId].price
    }
    // For unified tokens, get price from first grouped token
    if (!isBaseToken(token)) {
      for (const groupedToken of token.groupedTokens) {
        if (tokensUsdPriceData[groupedToken.defuseAssetId]) {
          return tokensUsdPriceData[groupedToken.defuseAssetId].price
        }
      }
    }
    return null
  })()
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

  const handleSetPercentage = (percent: number) => {
    if (tokenInBalance == null) return
    const scaledValue = (tokenInBalance.amount * BigInt(percent)) / 100n
    setValue("amountIn", formatUnits(scaledValue, tokenInBalance.decimals), {
      shouldValidate: true,
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

  const onRequestReview = () => {
    actorRef.send({ type: "REQUEST_REVIEW" })
  }

  const handleConfirmSubmit = () => {
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
  }

  return (
    <>
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onRequestReview)} className="mt-6">
          <div className="flex flex-col gap-2">
            <SelectTriggerLike
              icon={
                token ? (
                  <AssetComboIcon icon={token?.icon} />
                ) : (
                  <TokenIconPlaceholder className="size-10" />
                )
              }
              label={token ? "Token" : "Select token"}
              value={token?.name}
              onClick={handleSelect}
            />

            <RecipientSubForm
              form={form}
              chainType={chainType}
              userAddress={userAddress}
              displayAddress={displayAddress}
              tokenInBalance={tokenInBalance}
              presetContactId={presetContactId}
              noTokenForPresetNetwork={noTokenForPresetNetwork}
              onContactChange={setSelectedContact}
            />

            <SelectedTokenInput
              value={getValues().amountIn}
              label="Enter amount"
              registration={form.register("amountIn", {
                required: "This field is required",
                pattern: {
                  value: /^[0-9]*[,.]?[0-9]*$/,
                  message: "Please enter a valid number",
                },
                min:
                  minWithdrawalAmount != null
                    ? {
                        value: formatTokenValue(
                          minWithdrawalAmount.amount,
                          minWithdrawalAmount.decimals
                        ),
                        message: "Amount is too low",
                      }
                    : undefined,
                max:
                  tokenInBalance != null
                    ? {
                        value: formatTokenValue(
                          tokenInBalance.amount,
                          tokenInBalance.decimals
                        ),
                        message: "Insufficient balance",
                      }
                    : undefined,
              })}
              error={errors.amountIn?.message}
              balance={tokenInBalance?.amount ?? 0n}
              decimals={tokenInBalance?.decimals ?? 0}
              symbol={token.symbol}
              usdAmount={tokenToWithdrawUsdAmount}
              handleSetPercentage={handleSetPercentage}
              selectedToken={token}
              handleSelectToken={handleSelect}
              tokenPrice={tokenPrice}
              additionalInfo={
                tokenInTransitBalance ? (
                  <TooltipNew>
                    <TooltipNew.Trigger>
                      <button
                        type="button"
                        className="flex items-center justify-center size-6 rounded-lg shrink-0 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                      >
                        <Spinner size="sm" />
                      </button>
                    </TooltipNew.Trigger>
                    <TooltipNew.Content className="max-w-64 text-center text-balance">
                      Deposit of{" "}
                      {formatTokenValue(
                        tokenInTransitBalance.amount,
                        tokenInTransitBalance.decimals,
                        {
                          min: 0.0001,
                          fractionDigits: 4,
                        }
                      )}{" "}
                      {token.symbol} is in progress and will be available
                      shortly.
                    </TooltipNew.Content>
                  </TooltipNew>
                ) : null
              }
            />

            {!isNearIntentsNetwork(blockchain) &&
              isCexIncompatible(tokenOutDeployment) && (
                <AcknowledgementCheckbox
                  control={control}
                  errors={errors}
                  tokenOut={tokenOut}
                />
              )}

            <AuthGate
              renderHostAppLink={renderHostAppLink}
              shouldRender={isLoggedIn}
            >
              <Button
                size="xl"
                fullWidth
                type="submit"
                disabled={
                  state.matches("submitting") ||
                  noLiquidity ||
                  isPreparing ||
                  !amountIn ||
                  Number(amountIn) <= 0
                }
                loading={state.matches("submitting") || isPreparing}
              >
                {getWithdrawButtonText(
                  noLiquidity,
                  insufficientTokenInAmount,
                  !amountIn || Number(amountIn) <= 0
                )}
              </Button>
            </AuthGate>
          </div>
        </form>
      </FormProvider>

      {minWithdrawalAmountWithFee != null &&
        minWithdrawalAmountWithFee.amount > 1n &&
        parsedAmountIn != null &&
        parsedAmountIn.amount > 0n &&
        compareAmounts(parsedAmountIn, minWithdrawalAmountWithFee) === -1 && (
          <MinWithdrawalAmount
            minWithdrawalAmount={minWithdrawalAmountWithFee}
            tokenOut={tokenOut}
          />
        )}

      <PreparationResult
        preparationOutput={state.context.preparationOutput}
        increaseAmount={increaseAmount}
        decreaseAmount={decreaseAmount}
      />

      <ModalReviewSend
        open={isReviewOpen}
        onClose={() => actorRef.send({ type: "CANCEL_REVIEW" })}
        onConfirm={handleConfirmSubmit}
        loading={state.matches("submitting")}
        intentCreationResult={intentCreationResult}
        tokenIn={token}
        amountIn={amountIn}
        usdAmountIn={tokenToWithdrawUsdAmount ?? 0}
        recipient={recipient}
        network={blockchain}
        fee={withdtrawalFee}
        totalAmountReceived={totalAmountReceived}
        feeUsd={feeUsd}
        directionFee={directionFee}
        contact={selectedContact}
      />
    </>
  )
}
