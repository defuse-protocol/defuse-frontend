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
import {
  isBaseToken,
  isNativeToken,
} from "@src/components/DefuseSDK/utils/token"
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
import { useCallback, useEffect, useState } from "react"
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
  presetTokenSymbol,
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
    // When in contact mode, lock the network so only compatible tokens are selectable
    const lockedNetwork =
      selectedContact != null && isSupportedChainName(blockchain)
        ? blockchain
        : undefined
    setModalType(ModalType.MODAL_SELECT_ASSETS, {
      fieldName,
      [fieldName]: token,
      isHoldingsEnabled: true,
      lockedNetwork,
      disableZeroBalance: true, // Can only send tokens you have
    })
  }, [token, setModalType, selectedContact, blockchain])

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
    // Handle near_intents preset network (special case, not a SupportedChainName)
    if (presetNetwork === "near_intents") {
      setValue("blockchain", "near_intents")
      actorRef.send({
        type: "WITHDRAW_FORM.UPDATE_BLOCKCHAIN",
        params: { blockchain: "near_intents" },
      })
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

  // Track the resolved token for presetNetwork (null = not yet resolved)
  const [resolvedTokenSymbol, setResolvedTokenSymbol] = useState<string | null>(
    null
  )

  // Determine if we're still waiting to determine the correct token
  // Show loading until we've resolved which token to show AND the current token matches
  // (the state machine update is async, so we need to wait for it to complete)
  const isResolvingToken =
    presetNetwork != null &&
    isSupportedChainName(presetNetwork) &&
    (resolvedTokenSymbol === null || resolvedTokenSymbol !== token.symbol)

  // When balances are loaded, check if we need to switch to a better token
  // Priority order:
  // 1. presetTokenSymbol if provided and user has balance
  // 2. Native/gas token of the network if user has balance
  // 3. Highest-balance network-relevant token
  // 4. Native/gas token (even with zero balance) if it exists
  // 5. First available network-relevant token
  useEffect(() => {
    // Only run if we have a preset network and haven't already resolved
    if (
      presetNetwork == null ||
      !isSupportedChainName(presetNetwork) ||
      resolvedTokenSymbol !== null
    ) {
      return
    }

    // Wait until balances are loaded (non-empty)
    if (Object.keys(balances).length === 0) {
      return
    }

    // Helper: check if token supports the network
    const supportsNetwork = (t: TokenInfo): boolean => {
      return isBaseToken(t)
        ? t.deployments.some((d) => d.chainName === presetNetwork)
        : t.groupedTokens.some((gt) =>
            gt.deployments.some((d) => d.chainName === presetNetwork)
          )
    }

    // Helper: check if token is native for the network
    const isNativeForNetwork = (t: TokenInfo): boolean => {
      if (isBaseToken(t)) {
        return t.deployments.some(
          (d) => d.chainName === presetNetwork && isNativeToken(d)
        )
      }
      return t.groupedTokens.some((gt) =>
        gt.deployments.some(
          (d) => d.chainName === presetNetwork && isNativeToken(d)
        )
      )
    }

    // Helper: get token balance
    const getBalance = (t: TokenInfo): bigint => {
      const balance = computeTotalBalanceDifferentDecimals(t, balances)
      return balance?.amount ?? 0n
    }

    // Get all tokens that support the network
    const networkTokens = tokenList.filter(supportsNetwork)

    // Find the best token based on priority
    let bestToken: TokenInfo | null = null

    // Priority 1: presetTokenSymbol if provided and has balance
    if (presetTokenSymbol != null) {
      const presetToken = networkTokens.find(
        (t) =>
          t.symbol.toLowerCase().normalize() ===
          presetTokenSymbol.toLowerCase().normalize()
      )
      if (presetToken != null && getBalance(presetToken) > 0n) {
        bestToken = presetToken
      }
    }

    // Priority 2: Native token with balance
    if (bestToken == null) {
      const nativeToken = networkTokens.find(isNativeForNetwork)
      if (nativeToken != null && getBalance(nativeToken) > 0n) {
        bestToken = nativeToken
      }
    }

    // Priority 3: Highest-balance network token
    if (bestToken == null) {
      const tokensWithBalance = networkTokens
        .map((t) => ({ token: t, balance: getBalance(t) }))
        .filter(({ balance }) => balance > 0n)
        .sort((a, b) => {
          // Sort by balance descending (compare as bigint)
          if (a.balance > b.balance) return -1
          if (a.balance < b.balance) return 1
          return 0
        })

      if (tokensWithBalance.length > 0) {
        bestToken = tokensWithBalance[0].token
      }
    }

    // Priority 4: Native token (even with zero balance)
    if (bestToken == null) {
      const nativeToken = networkTokens.find(isNativeForNetwork)
      if (nativeToken != null) {
        bestToken = nativeToken
      }
    }

    // Priority 5: First available network token
    if (bestToken == null && networkTokens.length > 0) {
      bestToken = networkTokens[0]
    }

    // If we found a better token, switch to it
    if (bestToken != null && bestToken.symbol !== token.symbol) {
      const parsedAmount = {
        amount: 0n,
        decimals: getTokenMaxDecimals(bestToken),
      }
      actorRef.send({
        type: "WITHDRAW_FORM.UPDATE_TOKEN",
        params: {
          token: bestToken,
          parsedAmount: parsedAmount,
        },
      })
      setResolvedTokenSymbol(bestToken.symbol)
    } else {
      // Current token is the best choice, mark as resolved
      setResolvedTokenSymbol(token.symbol)
    }
  }, [
    presetNetwork,
    presetTokenSymbol,
    balances,
    token,
    tokenList,
    actorRef,
    resolvedTokenSymbol,
  ])

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
              tokenLoading={isResolvingToken}
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
