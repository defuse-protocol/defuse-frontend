"use client"

import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import {
  formatTokenValue,
  formatUsdAmount,
} from "@src/components/DefuseSDK/utils/format"
import { isBaseToken } from "@src/components/DefuseSDK/utils/token"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useRouter } from "next/navigation"
import { Dialog } from "radix-ui"
import { useMemo, useState } from "react"

// Get common withdrawal tokens (exclude earn-only tokens)
function getWithdrawTokens(): TokenInfo[] {
  return LIST_TOKENS.filter((token) => {
    if ("tags" in token && token.tags?.includes("category:earn-only")) {
      return false
    }
    return true
  }).slice(0, 20) // Limit to first 20 tokens for simplicity
}

interface EarnWithdrawDialogProps {
  open: boolean
  onClose: () => void
  smUsdcBalance: {
    amount: bigint
    decimals: number
  } | null
}

export default function EarnWithdrawDialog({
  open,
  onClose,
  smUsdcBalance,
}: EarnWithdrawDialogProps) {
  const router = useRouter()
  const { state } = useConnectWallet()
  const withdrawTokens = useMemo(() => getWithdrawTokens(), [])
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(
    withdrawTokens[0]
  )
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const [amount, setAmount] = useState("")
  const numericAmount = Number.parseFloat(amount) || 0

  const balanceAmount = smUsdcBalance?.amount ?? 0n
  const balanceDecimals = smUsdcBalance?.decimals ?? 6
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

  const handleWithdraw = () => {
    // Get the token symbol for the swap URL
    const tokenSymbol = selectedToken.symbol
    const params = new URLSearchParams({
      from: "smUSDC",
      to: tokenSymbol,
    })
    router.push(`/swap?${params.toString()}`)
    onClose()
  }

  const canWithdraw =
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
                    <div className="size-8 rounded-full border border-gray-100 flex items-center justify-center shadow-sm overflow-hidden bg-blue-50">
                      <span className="text-sm font-bold text-blue-600">
                        sm
                      </span>
                    </div>
                    <Dialog.Title className="text-base font-semibold text-gray-900">
                      Withdraw
                    </Dialog.Title>
                  </div>
                  <Dialog.Close className="size-10 rounded-xl hover:bg-gray-100 text-gray-500 flex items-center justify-center">
                    <XMarkIcon className="size-5" />
                  </Dialog.Close>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Your smUSDC Balance</span>
                  <span className="font-medium text-gray-900">
                    {state.isVerified
                      ? `${displayBalance} smUSDC`
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

                {/* Token Selector */}
                <div className="mt-5">
                  <div className="text-sm text-gray-500 mb-2">Receive as</div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTokenSelector(!showTokenSelector)}
                      className="w-full flex items-center justify-between gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {selectedToken?.icon && (
                          <img
                            src={selectedToken.icon}
                            alt={selectedToken.symbol}
                            className="size-6 rounded-full"
                          />
                        )}
                        <span className="font-medium text-gray-900">
                          {selectedToken?.symbol}
                        </span>
                      </div>
                      <ChevronDownIcon className="size-5 text-gray-400" />
                    </button>

                    {showTokenSelector && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                        {withdrawTokens.map((token) => (
                          <button
                            type="button"
                            key={
                              isBaseToken(token)
                                ? token.defuseAssetId
                                : token.unifiedAssetId
                            }
                            onClick={() => {
                              setSelectedToken(token)
                              setShowTokenSelector(false)
                            }}
                            className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 transition-colors"
                          >
                            {token.icon && (
                              <img
                                src={token.icon}
                                alt={token.symbol}
                                className="size-6 rounded-full"
                              />
                            )}
                            <span className="font-medium text-gray-900">
                              {token.symbol}
                            </span>
                            <span className="text-sm text-gray-500">
                              {token.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <Button
                    variant="primary"
                    size="xl"
                    fullWidth
                    disabled={!canWithdraw}
                    onClick={handleWithdraw}
                  >
                    {!state.isVerified
                      ? "Connect wallet"
                      : numericAmount <= 0
                        ? "Enter an amount"
                        : numericAmount > numericBalance
                          ? "Insufficient balance"
                          : `Withdraw to ${selectedToken?.symbol}`}
                  </Button>
                </div>

                <p className="mt-3 text-xs text-gray-500 text-center">
                  You will be redirected to swap your smUSDC for{" "}
                  {selectedToken?.symbol}
                </p>
              </Dialog.Content>
            </div>
          </div>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
