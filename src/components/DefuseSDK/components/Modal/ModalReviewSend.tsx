import Button from "@src/components/Button"
import { ContactsIcon } from "@src/icons"
import { useMemo } from "react"
import {
  chainIcons,
  getBlockchainsOptions,
  getNearIntentsOption,
  intentsChainIcon,
} from "../../constants/blockchains"
import IntentCreationResult from "../../features/account/components/IntentCreationResult"
import type { Context } from "../../features/machines/swapUIMachine"
import { midTruncate } from "../../features/withdraw/components/WithdrawForm/utils"
import type {
  SupportedChainName,
  TokenInfo,
  TokenValue,
} from "../../types/base"
import { assetNetworkAdapter } from "../../utils/adapters"
import {
  formatDisplayAmount,
  formatTokenValue,
  formatUsdAmount,
} from "../../utils/format"
import AssetComboIcon from "../Asset/AssetComboIcon"
import { NetworkIcon } from "../Network/NetworkIcon"
import { BaseModalDialog } from "./ModalDialog"

function getNetworkLabel(network: SupportedChainName | "near_intents"): string {
  if (network === "near_intents") {
    return getNearIntentsOption().intents.label
  }
  const blockchainEnum = assetNetworkAdapter[network]
  return getBlockchainsOptions()[blockchainEnum].label
}

const ModalReviewSend = ({
  open,
  onClose,
  onConfirm,
  loading,
  intentCreationResult,
  tokenIn,
  amountIn,
  usdAmountIn,
  recipient,
  network,
  fee,
  totalAmountReceived,
  feeUsd,
  directionFee,
  recipientContactName,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  intentCreationResult: Context["intentCreationResult"]
  tokenIn: TokenInfo
  amountIn: string
  usdAmountIn: number
  recipient: string
  network: SupportedChainName | "near_intents"
  fee: TokenValue
  feeUsd: number | null
  totalAmountReceived: TokenValue | null
  directionFee: TokenValue | null
  recipientContactName?: string | null
}) => {
  const chainIcon =
    network === "near_intents" ? intentsChainIcon : chainIcons[network]

  const formattedFee =
    totalAmountReceived == null
      ? "-"
      : formatTokenValue(fee.amount, fee.decimals)

  const receivedAmount = useMemo<string>(() => {
    if (totalAmountReceived == null) {
      return "-"
    }

    return formatTokenValue(
      totalAmountReceived.amount,
      totalAmountReceived.decimals,
      { min: 0.0000001 }
    )
  }, [totalAmountReceived])

  // Calculate direction fee USD value proportionally to the regular fee
  const directionFeeUsd = useMemo<number | null>(() => {
    if (directionFee == null || feeUsd == null || fee.amount === 0n) {
      return null
    }
    // Calculate proportion: directionFee / totalFee * feeUsd
    const totalFeeAmount = fee.amount
    if (totalFeeAmount === 0n) return null
    return (Number(directionFee.amount) / Number(totalFeeAmount)) * feeUsd
  }, [directionFee, feeUsd, fee.amount])

  return (
    <BaseModalDialog title="Review transfer" open={open} onClose={onClose}>
      <div className="flex flex-col items-center justify-center mt-3">
        <AssetComboIcon icon={tokenIn.icon} sizeClassName="size-13" />
        <div className="mt-5 text-2xl/7 font-bold text-gray-900 tracking-tight">
          {formatDisplayAmount(amountIn)} {tokenIn.symbol}
        </div>
        <div className="mt-1 text-base/5 font-medium text-gray-500">
          {formatUsdAmount(usdAmountIn)}
        </div>
      </div>

      <dl className="mt-7 pt-5 border-t border-gray-200 space-y-2">
        <div
          className={`flex justify-between gap-2 ${recipientContactName ? "items-start" : "items-center"}`}
        >
          <dt className="text-sm text-gray-500 font-medium truncate">
            {recipientContactName ? "Recipient is your contact" : "Recipient"}
          </dt>
          <dd className="text-sm font-semibold text-gray-900 text-right">
            {recipientContactName ? (
              <div className="flex flex-col items-end">
                <div className="flex items-start gap-1">
                  <div className="flex flex-col items-end">
                    <span>{recipientContactName}</span>
                    <span className="text-xs text-gray-500 font-medium text-right">
                      {midTruncate(recipient, 16)}
                    </span>
                  </div>
                  <ContactsIcon className="mt-0.5 size-4 text-gray-500 shrink-0" />
                </div>
              </div>
            ) : (
              midTruncate(recipient, 16)
            )}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-sm text-gray-500 font-medium truncate">
            Network
          </dt>
          <dd className="flex items-center gap-1 text-sm font-semibold text-gray-900 whitespace-pre">
            {getNetworkLabel(network)}
            <NetworkIcon chainIcon={chainIcon} sizeClassName="size-4" />
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-sm text-gray-500 font-medium truncate">Fee</dt>
          <dd className="flex items-center gap-1 text-sm font-semibold text-gray-900 whitespace-pre">
            {formattedFee} {tokenIn.symbol}{" "}
            <AssetComboIcon icon={tokenIn.icon} sizeClassName="size-4" />
          </dd>
        </div>

        {receivedAmount !== "-" && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-sm text-gray-500 font-medium truncate">
              Recipient receives
            </dt>
            <dd className="flex items-center gap-1 text-sm font-semibold text-gray-900 whitespace-pre">
              {receivedAmount} {tokenIn.symbol}
              <AssetComboIcon icon={tokenIn.icon} sizeClassName="size-4" />
            </dd>
          </div>
        )}

        {directionFee != null && directionFee.amount > 0n && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-sm text-gray-500 font-medium truncate">
              Direction fee
            </dt>
            <dd className="flex items-center gap-1 text-sm font-semibold text-gray-900 whitespace-pre">
              <span className="text-gray-500">
                (~{formatUsdAmount(directionFeeUsd ?? 0)})
              </span>
              {formatTokenValue(directionFee.amount, directionFee.decimals)}{" "}
              {tokenIn.symbol}
              <AssetComboIcon icon={tokenIn.icon} sizeClassName="size-4" />
            </dd>
          </div>
        )}
      </dl>

      <Button
        className="mt-5"
        type="button"
        size="xl"
        onClick={onConfirm}
        loading={loading}
        fullWidth
      >
        Transfer
      </Button>

      <IntentCreationResult intentCreationResult={intentCreationResult} />
    </BaseModalDialog>
  )
}

export default ModalReviewSend
