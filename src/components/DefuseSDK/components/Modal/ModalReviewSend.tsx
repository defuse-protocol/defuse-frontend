import { CheckBadgeIcon } from "@heroicons/react/16/solid"
import * as Switch from "@radix-ui/react-switch"
import { createContact } from "@src/app/(app)/(auth)/contacts/actions"
import Button from "@src/components/Button"
import { CopyButton } from "@src/components/DefuseSDK/components/IntentCard/CopyButton"
import TooltipNew from "@src/components/DefuseSDK/components/TooltipNew"
import ErrorMessage from "@src/components/ErrorMessage"
import { WalletIcon } from "@src/icons"
import { useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import {
  chainIcons,
  getBlockchainsOptions,
  getNearIntentsOption,
  intentsChainIcon,
} from "../../constants/blockchains"
import IntentCreationResult from "../../features/account/components/IntentCreationResult"
import type { Context } from "../../features/machines/swapUIMachine"
import {
  isNearIntentsNetwork,
  midTruncate,
} from "../../features/withdraw/components/WithdrawForm/utils"
import type {
  SupportedChainName,
  TokenInfo,
  TokenValue,
} from "../../types/base"
import { assetNetworkAdapter } from "../../utils/adapters"
import { isSupportedChainName } from "../../utils/blockchain"
import {
  formatDisplayAmount,
  formatTokenValue,
  formatUsdAmount,
} from "../../utils/format"
import { stringToColor } from "../../utils/stringToColor"
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
  onContactSaved,
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
  onContactSaved?: (contactName: string) => void
}) => {
  const queryClient = useQueryClient()
  const [saveAsContact, setSaveAsContact] = useState(false)
  const [contactName, setContactName] = useState("")
  const [contactError, setContactError] = useState<string | null>(null)
  const [isSavingContact, setIsSavingContact] = useState(false)

  const isExistingContact = Boolean(recipientContactName)
  const canSaveContact = !isExistingContact && !isNearIntentsNetwork(network)
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

  const contactColor = recipientContactName
    ? stringToColor(
        `${recipientContactName}${recipient}${network !== "near_intents" ? assetNetworkAdapter[network] : network}`
      )
    : null

  const handleTransfer = async () => {
    const trimmedContactName = contactName.trim()

    if (saveAsContact && !trimmedContactName) {
      setContactError("Please enter a name for the contact.")
      return
    }

    if (saveAsContact && isSupportedChainName(network)) {
      setIsSavingContact(true)
      setContactError(null)

      try {
        const blockchainEnum = assetNetworkAdapter[network]
        const result = await createContact({
          name: trimmedContactName,
          address: recipient,
          blockchain: blockchainEnum,
        })

        if (!result.ok) {
          setContactError(result.error)
          setIsSavingContact(false)
          return
        }

        queryClient.invalidateQueries({ queryKey: ["contacts"] })
        onContactSaved?.(trimmedContactName)
      } catch {
        setContactError("Failed to save contact. Please try again.")
        setIsSavingContact(false)
        return
      }

      setIsSavingContact(false)
    }

    onConfirm()
  }

  return (
    <BaseModalDialog title="Review transfer" open={open} onClose={onClose}>
      <div className="flex flex-col items-center justify-center mt-3">
        <div
          className="size-13 rounded-full bg-surface-active flex items-center justify-center shrink-0 outline-1 -outline-offset-1 outline-fg/10"
          style={
            contactColor
              ? { backgroundColor: contactColor.background }
              : undefined
          }
        >
          <WalletIcon
            className="size-5 text-fg-secondary"
            style={contactColor ? { color: contactColor.icon } : undefined}
          />
        </div>

        <div className="mt-5 text-2xl/7 font-bold text-fg tracking-tight text-center">
          Confirm transfer to <br />
          <TooltipNew>
            <TooltipNew.Trigger>
              <span className="cursor-pointer">{midTruncate(recipient)}</span>
            </TooltipNew.Trigger>
            <TooltipNew.Content
              side="top"
              className="max-w-56 px-3 py-2 flex items-center gap-2"
            >
              <span className="text-xs font-medium break-all text-center text-balance font-mono">
                {recipient}
              </span>
              <CopyButton
                text={recipient}
                ariaLabel="Copy recipient address"
                className="hover:text-gray-200"
              />
            </TooltipNew.Content>
          </TooltipNew>
        </div>
        {recipientContactName && (
          <div className="flex items-start justify-center gap-1 mt-2">
            <CheckBadgeIcon className="mt-0.5 text-green-500 size-4 shrink-0" />
            <div className="text-base/5 font-medium text-fg-secondary text-center">
              {recipientContactName}
            </div>
          </div>
        )}
      </div>

      <dl className="mt-7 pt-5 border-t border-border space-y-2">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-sm text-fg-secondary font-medium truncate">
            Amount
          </dt>
          <dd className="flex items-center gap-1 text-sm font-semibold text-fg whitespace-pre">
            {formatDisplayAmount(amountIn)} {tokenIn.symbol}
            <AssetComboIcon icon={tokenIn.icon} sizeClassName="size-4" />
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-sm text-fg-secondary font-medium truncate">
            Value
          </dt>
          <dd className="flex items-center gap-1 text-sm font-semibold text-fg whitespace-pre">
            {formatUsdAmount(usdAmountIn)}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-sm text-fg-secondary font-medium truncate">
            Network
          </dt>
          <dd className="flex items-center gap-1 text-sm font-semibold text-fg whitespace-pre">
            {getNetworkLabel(network)}
            <NetworkIcon chainIcon={chainIcon} sizeClassName="size-4" />
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-sm text-fg-secondary font-medium truncate">
            Fee
          </dt>
          <dd className="flex items-center gap-1 text-sm font-semibold text-fg whitespace-pre">
            {formattedFee} {tokenIn.symbol}{" "}
            <AssetComboIcon icon={tokenIn.icon} sizeClassName="size-4" />
          </dd>
        </div>

        {receivedAmount !== "-" && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-sm text-fg-secondary font-medium truncate">
              Recipient receives
            </dt>
            <dd className="flex items-center gap-1 text-sm font-semibold text-fg whitespace-pre">
              {receivedAmount} {tokenIn.symbol}
              <AssetComboIcon icon={tokenIn.icon} sizeClassName="size-4" />
            </dd>
          </div>
        )}

        {directionFee != null && directionFee.amount > 0n && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-sm text-fg-secondary font-medium truncate">
              Direction fee
            </dt>
            <dd className="flex items-center gap-1 text-sm font-semibold text-fg whitespace-pre">
              <span className="text-fg-secondary">
                (~{formatUsdAmount(directionFeeUsd ?? 0)})
              </span>
              {formatTokenValue(directionFee.amount, directionFee.decimals)}{" "}
              {tokenIn.symbol}
              <AssetComboIcon icon={tokenIn.icon} sizeClassName="size-4" />
            </dd>
          </div>
        )}
      </dl>

      {canSaveContact && (
        <div className="mt-5 pt-5 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-fg-secondary">
              Save recipient to contacts
            </span>
            <Switch.Root
              checked={saveAsContact}
              onCheckedChange={(checked) => {
                setSaveAsContact(checked)
                if (!checked) {
                  setContactName("")
                  setContactError(null)
                }
              }}
              className="group relative flex h-5 w-12 cursor-pointer rounded-lg bg-border-strong p-1 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2 data-[state=checked]:bg-fg"
            >
              <Switch.Thumb className="pointer-events-none inline-block h-3 w-4 translate-x-0 rounded bg-white shadow-lg ring-0 transition duration-200 ease-in-out data-[state=checked]:translate-x-6" />
            </Switch.Root>
          </div>

          {saveAsContact && (
            <div>
              <input
                type="text"
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value)
                  setContactError(null)
                }}
                placeholder="Enter a name"
                className="w-full rounded-xl border border-border bg-surface-card px-3 py-2 text-base font-medium text-fg placeholder:text-fg-tertiary focus:border-fg focus:outline-none focus:ring-1 focus:ring-fg"
              />
              {contactError && (
                <ErrorMessage className="mt-1">{contactError}</ErrorMessage>
              )}
            </div>
          )}
        </div>
      )}

      <Button
        className="mt-5"
        type="button"
        size="xl"
        onClick={handleTransfer}
        loading={loading || isSavingContact}
        disabled={saveAsContact && !contactName.trim()}
        fullWidth
      >
        Transfer
      </Button>

      <IntentCreationResult intentCreationResult={intentCreationResult} />
    </BaseModalDialog>
  )
}

export default ModalReviewSend
