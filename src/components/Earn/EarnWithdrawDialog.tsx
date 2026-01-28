"use client"

import type { walletMessage } from "@defuse-protocol/internal-utils"
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/20/solid"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { isBaseToken } from "@src/components/DefuseSDK/utils/token"
import { Dialog } from "radix-ui"
import { useMemo, useState } from "react"
import { EarnSwapForm } from "./EarnSwapForm"
import {
  EarnFormProvider,
  EarnUIMachineProvider,
} from "./EarnUIMachineProvider"
import { useEarnTokenList } from "./hooks/useEarnTokenList"

interface EarnWithdrawDialogProps {
  open: boolean
  onClose: () => void
  smUsdcBalance: {
    amount: bigint
    decimals: number
  } | null
  userAddress: string | undefined
  userChainType: string | undefined
  signMessage: (
    params: walletMessage.WalletMessage
  ) => Promise<walletMessage.WalletSignatureResult | null>
  onSuccess?: () => void
}

export default function EarnWithdrawDialog({
  open,
  onClose,
  smUsdcBalance,
  userAddress,
  userChainType,
  signMessage,
  onSuccess,
}: EarnWithdrawDialogProps) {
  const { smUsdcToken, selectableTokens } = useEarnTokenList()
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(
    selectableTokens[0]
  )
  const [showTokenSelector, setShowTokenSelector] = useState(false)

  const balanceAmount = smUsdcBalance?.amount ?? 0n
  const balanceDecimals = smUsdcBalance?.decimals ?? 6
  const displayBalance = formatTokenValue(balanceAmount, balanceDecimals, {
    fractionDigits: 4,
  })

  // Build token list for the machine - include smUSDC and selectable tokens
  const tokenList = useMemo(() => {
    if (!smUsdcToken) return selectableTokens
    return [smUsdcToken, ...selectableTokens]
  }, [smUsdcToken, selectableTokens])

  if (!smUsdcToken) {
    return null
  }

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

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
                    {userAddress
                      ? `${displayBalance} smUSDC`
                      : "Connect wallet"}
                  </span>
                </div>

                {/* Token Selector - placed above the form */}
                <div className="mt-4">
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
                        {selectableTokens.map((token) => (
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

                <div className="mt-4">
                  <EarnFormProvider>
                    <EarnUIMachineProvider
                      mode="withdraw"
                      tokenList={tokenList}
                      smUsdcToken={smUsdcToken}
                      signMessage={signMessage}
                    >
                      <EarnSwapForm
                        mode="withdraw"
                        userAddress={userAddress}
                        userChainType={
                          userChainType as
                            | "near"
                            | "evm"
                            | "solana"
                            | "webauthn"
                            | "ton"
                            | "stellar"
                            | "tron"
                            | undefined
                        }
                        onSuccess={handleSuccess}
                        selectedToken={selectedToken}
                        submitLabel={`Withdraw to ${selectedToken?.symbol}`}
                      />
                    </EarnUIMachineProvider>
                  </EarnFormProvider>
                </div>
              </Dialog.Content>
            </div>
          </div>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
