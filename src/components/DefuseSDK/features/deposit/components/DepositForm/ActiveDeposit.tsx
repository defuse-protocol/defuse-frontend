import type { BlockchainEnum } from "@defuse-protocol/internal-utils"
import { InformationCircleIcon } from "@heroicons/react/16/solid"
import Button from "@src/components/Button"
import TooltipNew from "@src/components/DefuseSDK/components/TooltipNew"
import { RESERVED_NEAR_BALANCE } from "@src/components/DefuseSDK/services/blockchainBalanceService"
import {
  isFungibleToken,
  isNativeToken,
} from "@src/components/DefuseSDK/utils/token"
import { HorizontalProgressDots } from "@src/components/ProgressIndicator"
import { useActivityDock } from "@src/providers/ActivityDockProvider"
import { useSelector } from "@xstate/react"
import { useEffect, useRef } from "react"
import { useFormContext } from "react-hook-form"
import AssetComboIcon from "../../../../components/Asset/AssetComboIcon"
import { getBlockchainsOptions } from "../../../../constants/blockchains"
import { useTokensUsdPrices } from "../../../../hooks/useTokensUsdPrices"
import type { BaseTokenInfo, TokenDeployment } from "../../../../types/base"
import { reverseAssetNetworkAdapter } from "../../../../utils/adapters"
import { blockExplorerTxLinkFactory } from "../../../../utils/chainTxExplorer"
import { formatTokenValue } from "../../../../utils/format"
import getTokenUsdPrice from "../../../../utils/getTokenUsdPrice"
import {
  DEPOSIT_STAGES,
  DEPOSIT_STAGE_LABELS_SHORT,
} from "../../utils/depositStatusUtils"
import { DepositUIMachineContext } from "../DepositUIMachineProvider"
import { DepositWarning } from "../DepositWarning"
import SelectedTokenInput from "./SelectedTokenInput"
import type { DepositFormValues } from "./index"

export type ActiveDepositProps = {
  network: BlockchainEnum
  token: BaseTokenInfo
  tokenDeployment: TokenDeployment
  minDepositAmount: bigint | null
}

export function ActiveDeposit({
  network,
  token,
  tokenDeployment,
  minDepositAmount,
}: ActiveDepositProps) {
  const { addDockItem, updateDockItem, settleDockItem } = useActivityDock()
  const { register, setValue, watch } = useFormContext<DepositFormValues>()
  const actorRef = DepositUIMachineContext.useActorRef()
  const inputAmount = watch("amount")
  const currentDepositIdRef = useRef<string | null>(null)
  const wasLoadingRef = useRef(false)

  const {
    amount,
    parsedAmount,
    depositOutput,
    preparationOutput,
    depositTokenBalanceRef,
    isLoading,
    isPreparing,
  } = DepositUIMachineContext.useSelector((snapshot) => {
    const amount = snapshot.context.depositFormRef.getSnapshot().context.amount
    const parsedAmount =
      snapshot.context.depositFormRef.getSnapshot().context.parsedAmount
    return {
      amount,
      parsedAmount,
      depositOutput: snapshot.context.depositOutput,
      preparationOutput: snapshot.context.preparationOutput,
      depositTokenBalanceRef: snapshot.context.depositTokenBalanceRef,
      isLoading:
        snapshot.matches("submittingNearTx") ||
        snapshot.matches("submittingEVMTx") ||
        snapshot.matches("submittingSolanaTx") ||
        snapshot.matches("submittingTurboTx") ||
        snapshot.matches("submittingStellarTx"),
      isPreparing:
        typeof snapshot.value === "object" &&
        "editing" in snapshot.value &&
        snapshot.value.editing === "preparation",
    }
  })

  const { balance } = useSelector(depositTokenBalanceRef, (state) => ({
    balance:
      state.context.preparationOutput?.tag === "ok"
        ? state.context.preparationOutput.value.balance
        : null,
  }))

  useEffect(() => {
    if (isLoading && !wasLoadingRef.current && parsedAmount != null) {
      const depositId = crypto.randomUUID()
      currentDepositIdRef.current = depositId

      const formattedAmount = formatTokenValue(
        parsedAmount,
        tokenDeployment.decimals,
        {
          min: 0.0001,
          fractionDigits: 4,
        }
      )
      const chainName = reverseAssetNetworkAdapter[network]

      addDockItem({
        id: `deposit-${depositId}`,
        title: `Deposit ${formattedAmount} ${token.symbol}`,
        icon: (
          <AssetComboIcon
            sizeClassName="size-6"
            icon={token.icon}
            chainName={chainName}
          />
        ),
        rawIcon: true,
        keyValueRows: [],
        renderContent: () => (
          <HorizontalProgressDots
            stages={DEPOSIT_STAGES}
            stageLabelsShort={DEPOSIT_STAGE_LABELS_SHORT}
            displayStage="submitting"
            displayIndex={0}
            hasError={false}
            isSuccess={false}
          />
        ),
      })
    }
    wasLoadingRef.current = isLoading
  }, [isLoading, parsedAmount, token, tokenDeployment, network, addDockItem])

  useEffect(() => {
    if (!depositOutput) return

    if (currentDepositIdRef.current) {
      const dockId = `deposit-${currentDepositIdRef.current}`
      const chainName = reverseAssetNetworkAdapter[network]

      if (depositOutput.tag === "ok") {
        const explorerUrl = blockExplorerTxLinkFactory(
          chainName,
          depositOutput.value.txHash
        )
        updateDockItem(dockId, {
          explorerUrl,
          renderContent: () => (
            <HorizontalProgressDots
              stages={DEPOSIT_STAGES}
              stageLabelsShort={DEPOSIT_STAGE_LABELS_SHORT}
              displayStage="complete"
              displayIndex={1}
              hasError={false}
              isSuccess={true}
            />
          ),
        })
      } else {
        updateDockItem(dockId, {
          renderContent: () => (
            <HorizontalProgressDots
              stages={DEPOSIT_STAGES}
              stageLabelsShort={DEPOSIT_STAGE_LABELS_SHORT}
              displayStage="complete"
              displayIndex={1}
              hasError={true}
              isSuccess={false}
            />
          ),
        })
      }
      settleDockItem(dockId)
      currentDepositIdRef.current = null
    }

    actorRef.send({ type: "CLEAR_DEPOSIT_OUTPUT" })
  }, [depositOutput, actorRef, network, updateDockItem, settleDockItem])

  const balanceInsufficient =
    balance != null
      ? isInsufficientBalance(amount, balance, tokenDeployment, network)
      : null

  const hasUserEnteredAmount = Number(inputAmount) > 0
  const isDepositAmountHighEnough =
    minDepositAmount != null && parsedAmount !== null && hasUserEnteredAmount
      ? parsedAmount >= minDepositAmount
      : true

  const maxDepositValue =
    preparationOutput?.tag === "ok"
      ? preparationOutput.value.maxDepositValue
      : null

  const handleSetPercentage = (percent: number) => {
    if (balance == null) return
    const baseValue = maxDepositValue ?? balance
    const scaledValue = (baseValue * BigInt(percent)) / 100n
    const amountToFormat = formatTokenValue(
      scaledValue,
      tokenDeployment.decimals
    )
    setValue("amount", amountToFormat)
  }

  const { data: tokensUsdPriceData } = useTokensUsdPrices()
  const usdAmountToDeposit = getTokenUsdPrice(amount, token, tokensUsdPriceData)

  const blockchainOptions = getBlockchainsOptions()
  const networkLabel = blockchainOptions[network]?.label ?? ""

  return (
    <div className="flex flex-col mt-6">
      <SelectedTokenInput
        label="Enter amount"
        value={inputAmount}
        symbol={token.symbol}
        icon={token.icon}
        balance={balance ?? 0n}
        usdAmount={usdAmountToDeposit}
        decimals={tokenDeployment.decimals}
        handleSetPercentage={handleSetPercentage}
        isNativeToken={isNativeToken(tokenDeployment)}
        networkName={networkLabel}
        registration={register("amount", {
          required: true,
          validate: (value) => {
            if (!value) return true
            const num = Number.parseFloat(value.replace(",", "."))
            return (
              (!Number.isNaN(num) && num > 0) ||
              "It seems you entered an invalid amount. Please try again."
            )
          },
        })}
        additionalInfo={
          isFungibleToken(tokenDeployment) &&
          tokenDeployment.address === "wrap.near" ? (
            <TooltipNew>
              <TooltipNew.Trigger>
                <button
                  type="button"
                  className="flex items-center justify-center size-6 rounded-lg shrink-0 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                  aria-label="Additional information"
                >
                  <InformationCircleIcon className="size-4" />
                </button>
              </TooltipNew.Trigger>
              <TooltipNew.Content className="max-w-72 text-center text-balance">
                Combined balance of NEAR and wNEAR. NEAR will be automatically
                wrapped to wNEAR if your wNEAR balance isn't sufficient for the
                swap.
                <br />
                <br />
                Note that to cover network fees, we reserve
                {` ${formatTokenValue(RESERVED_NEAR_BALANCE, tokenDeployment.decimals)} NEAR `}
                in your wallet.
              </TooltipNew.Content>
            </TooltipNew>
          ) : null
        }
      />

      <Button
        className="mt-6"
        type="submit"
        size="xl"
        fullWidth
        loading={isLoading}
        disabled={
          !Number(inputAmount) ||
          balanceInsufficient ||
          !isDepositAmountHighEnough ||
          isPreparing
        }
      >
        {renderDepositButtonText(
          inputAmount === "",
          Number(inputAmount) > 0 &&
            (balanceInsufficient !== null ? balanceInsufficient : false),
          network,
          token,
          tokenDeployment,
          minDepositAmount,
          isDepositAmountHighEnough,
          isLoading,
          isPreparing
        )}
      </Button>

      <DepositWarning
        depositWarning={depositOutput || preparationOutput}
        className="mt-6"
        tokenSymbol={token.symbol}
        networkLabel={networkLabel}
      />
    </div>
  )
}

function renderDepositButtonText(
  isAmountEmpty: boolean,
  isBalanceInsufficient: boolean,
  network: BlockchainEnum | null,
  token: BaseTokenInfo,
  tokenDeployment: TokenDeployment,
  minDepositAmount: bigint | null,
  isDepositAmountHighEnough: boolean,
  isLoading: boolean,
  isPreparing: boolean
) {
  if (isLoading) {
    return "Processing..."
  }
  if (isAmountEmpty) {
    return "Please enter an amount"
  }
  if (!isDepositAmountHighEnough && minDepositAmount != null) {
    return `Minimum deposit is ${formatTokenValue(minDepositAmount, tokenDeployment.decimals)} ${token.symbol}`
  }
  if (isBalanceInsufficient) {
    return "Insufficient balance"
  }
  if (isPreparing) {
    return "Preparing deposit..."
  }
  if (!!network && !!token) {
    return "Deposit"
  }
  return !network && !token
    ? "Please select an asset."
    : "Please select a network."
}

function isInsufficientBalance(
  formAmount: string,
  balance: bigint,
  token: TokenDeployment,
  network: BlockchainEnum | null
): boolean | null {
  if (!network) {
    return null
  }

  const balanceToFormat = formatTokenValue(balance, token.decimals)
  return Number.parseFloat(formAmount) > Number.parseFloat(balanceToFormat)
}
