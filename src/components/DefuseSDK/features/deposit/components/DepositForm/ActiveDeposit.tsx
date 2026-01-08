import type { BlockchainEnum } from "@defuse-protocol/internal-utils"
import Button from "@src/components/Button"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { chainTxExplorer } from "@src/components/DefuseSDK/utils/chainTxExplorer"
import { useActivityDock } from "@src/providers/ActivityDockProvider"
import { useSelector } from "@xstate/react"
import { useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { useTokensUsdPrices } from "../../../../hooks/useTokensUsdPrices"
import type { BaseTokenInfo, TokenDeployment } from "../../../../types/base"
import { reverseAssetNetworkAdapter } from "../../../../utils/adapters"
import { formatTokenValue } from "../../../../utils/format"
import getTokenUsdPrice from "../../../../utils/getTokenUsdPrice"
import { midTruncate } from "../../../withdraw/components/WithdrawForm/utils"
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
  const { addDockItem, hasDockItem } = useActivityDock()
  const { register, setValue, watch } = useFormContext<DepositFormValues>()
  const actorRef = DepositUIMachineContext.useActorRef()
  const inputAmount = watch("amount")

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
    if (!depositOutput) return
    if (depositOutput?.tag !== "ok") return
    if (hasDockItem(depositOutput.value.txHash)) return

    const explorerUrl = chainTxExplorer(reverseAssetNetworkAdapter[network])
    const txHash = depositOutput.value.txHash

    const txUrl = explorerUrl + txHash

    addDockItem({
      id: depositOutput.value.txHash,
      title: "Deposit completed",
      explorerUrl: txUrl,
      icon: (
        <AssetComboIcon
          sizeClassName="size-8"
          icon={depositOutput.value.depositDescription.derivedToken.icon}
        />
      ),
      keyValueRows: [
        {
          label: "From",
          value: midTruncate(
            depositOutput.value.depositDescription.userAddress
          ),
        },
        {
          label: "Amount",
          value: `${formatTokenValue(
            depositOutput.value.depositDescription.amount,
            depositOutput.value.depositDescription.tokenDeployment.decimals,
            {
              min: 0.0001,
              fractionDigits: 4,
            }
          )} ${depositOutput.value.depositDescription.derivedToken.symbol}`,
        },
      ],
    })

    actorRef.send({ type: "CLEAR_DEPOSIT_OUTPUT" })
  }, [depositOutput, network, addDockItem, hasDockItem, actorRef])

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

  return (
    <div className="flex flex-col mt-6">
      <SelectedTokenInput
        label="Enter amount"
        value={inputAmount}
        symbol={token.symbol}
        balance={balance ?? 0n}
        usdAmount={usdAmountToDeposit}
        token={tokenDeployment}
        handleSetPercentage={handleSetPercentage}
        registration={register("amount", {
          required: true,
          validate: (value) => {
            if (!value) return true
            const num = Number.parseFloat(value.replace(",", "."))
            return (!Number.isNaN(num) && num > 0) || "Enter a valid amount"
          },
        })}
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
    return "Enter amount"
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
  return !network && !token ? "Select asset first" : "Select network"
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
