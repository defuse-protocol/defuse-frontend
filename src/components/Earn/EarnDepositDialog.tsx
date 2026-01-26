"use client"

import { authIdentity } from "@defuse-protocol/internal-utils"
import { XMarkIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import { useWatchHoldings } from "@src/components/DefuseSDK/features/account/hooks/useWatchHoldings"
import {
  formatTokenValue,
  formatUsdAmount,
} from "@src/components/DefuseSDK/utils/format"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useRouter } from "next/navigation"
import { Dialog } from "radix-ui"
import { useMemo, useState } from "react"
import type { Vault } from "./types"

export default function EarnDepositDialog({
  open,
  onClose,
  vault,
}: {
  open: boolean
  onClose: () => void
  vault: Vault
}) {
  const router = useRouter()
  const { state } = useConnectWallet()
  const [amount, setAmount] = useState("")

  // Find the token info for the vault's token (e.g., USDC)
  const vaultToken = useMemo(
    () => LIST_TOKENS.find((t) => t.symbol === vault.token),
    [vault.token]
  )
  const numericAmount = Number.parseFloat(amount) || 0

  // Get user ID for balance fetching
  const userId =
    state.isVerified && state.address && state.chainType
      ? authIdentity.authHandleToIntentsUserId(state.address, state.chainType)
      : null

  // Fetch balance for the vault token
  const tokenListForBalance = useMemo(
    () => (vaultToken ? [vaultToken] : []),
    [vaultToken]
  )
  const { data: holdings } = useWatchHoldings({
    userId,
    tokenList: tokenListForBalance,
  })

  const vaultTokenBalance = holdings?.[0]
  const balanceAmount = vaultTokenBalance?.value?.amount ?? 0n
  const balanceDecimals = vaultTokenBalance?.value?.decimals ?? 6
  const displayBalance = formatTokenValue(balanceAmount, balanceDecimals, {
    fractionDigits: 4,
  })
  const numericBalance = Number(balanceAmount) / 10 ** balanceDecimals || 0

  const handleSetMax = () => {
    if (balanceAmount > 0n) {
      setAmount(
        formatTokenValue(balanceAmount, balanceDecimals, {
          fractionDigits: balanceDecimals,
        })
      )
    }
  }

  const handleDeposit = () => {
    const params = new URLSearchParams({
      from: vaultToken?.symbol ?? vault.token,
      to: "smUSDC",
    })
    router.push(`/swap?${params.toString()}`)
    onClose()
  }

  const canDeposit =
    numericAmount > 0 && numericAmount <= numericBalance && state.isVerified

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-gray-900/80 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out">
          <div className="fixed inset-0 z-20 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-start sm:pt-[10vh]">
              <Dialog.Content
                className="relative rounded-3xl bg-white p-5 shadow-xl w-full sm:max-w-sm data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-2 data-[state=closed]:fade-out"
                onOpenAutoFocus={(e) => e.preventDefault()}
                aria-describedby={undefined}
              >
                <div className="flex items-center justify-between -mr-2.5 -mt-2.5">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full border border-gray-100 flex items-center justify-center shadow-sm overflow-hidden">
                      {vaultToken?.icon && (
                        <img
                          src={vaultToken.icon}
                          alt={vaultToken.symbol}
                          className="size-6"
                        />
                      )}
                    </div>
                    <Dialog.Title className="text-base font-semibold text-gray-900">
                      Deposit {vault.token}
                    </Dialog.Title>
                  </div>
                  <Dialog.Close className="size-10 rounded-xl hover:bg-gray-100 text-gray-500 flex items-center justify-center">
                    <XMarkIcon className="size-5" />
                  </Dialog.Close>
                </div>

                <div className="mt-4 bg-green-50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-green-600 font-medium uppercase tracking-wide">
                      Current APY
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {vault.apy}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Vault</div>
                    <div className="text-sm font-medium text-gray-700">
                      {vault.name}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Your Balance</span>
                  <span className="font-medium text-gray-900">
                    {state.isVerified
                      ? `${displayBalance} ${vaultToken?.symbol}`
                      : "Connect wallet"}
                  </span>
                </div>

                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-2xl p-4 focus-within:border-gray-300 focus-within:bg-white transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={amount}
                      onChange={(e) =>
                        /^\d*\.?\d*$/.test(e.target.value) &&
                        setAmount(e.target.value)
                      }
                      className="flex-1 bg-transparent font-bold text-gray-900 text-3xl tracking-tight placeholder:text-gray-400 outline-none min-w-0"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSetMax}
                      disabled={!state.isVerified || balanceAmount === 0n}
                    >
                      Max
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {formatUsdAmount(numericAmount)}
                  </div>
                </div>

                <div className="mt-5 bg-gray-50 rounded-2xl p-4 space-y-3">
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Projected Earnings
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly</span>
                    <span className="font-semibold text-gray-900">
                      {formatUsdAmount((numericAmount * vault.apy) / 100 / 12)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Yearly</span>
                    <span className="font-semibold text-gray-900">
                      {formatUsdAmount((numericAmount * vault.apy) / 100)}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <Button
                    variant="primary"
                    size="xl"
                    fullWidth
                    disabled={!canDeposit}
                    onClick={handleDeposit}
                  >
                    {!state.isVerified
                      ? "Connect wallet"
                      : numericAmount <= 0
                        ? "Enter an amount"
                        : numericAmount > numericBalance
                          ? "Insufficient balance"
                          : `Deposit ${vaultToken?.symbol}`}
                  </Button>
                </div>

                <p className="mt-3 text-xs text-gray-500 text-center">
                  You will be redirected to swap your {vaultToken?.symbol} for
                  smUSDC
                </p>
              </Dialog.Content>
            </div>
          </div>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
