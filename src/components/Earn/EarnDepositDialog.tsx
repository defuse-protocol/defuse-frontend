"use client"

import type { AuthMethod, walletMessage } from "@defuse-protocol/internal-utils"
import { XMarkIcon } from "@heroicons/react/20/solid"
import { ModalContainer } from "@src/components/DefuseSDK/components/Modal/ModalContainer"
import { TokenListUpdater } from "@src/components/DefuseSDK/components/TokenListUpdater"
import { ModalStoreProvider } from "@src/components/DefuseSDK/providers/ModalStoreProvider"
import { TokensStoreProvider } from "@src/components/DefuseSDK/providers/TokensStoreProvider"
import { formatUsdAmount } from "@src/components/DefuseSDK/utils/format"
import { Dialog } from "radix-ui"
import { useMemo } from "react"
import { EarnSwapForm } from "./EarnSwapForm"
import {
  EarnFormProvider,
  EarnUIMachineProvider,
} from "./EarnUIMachineProvider"
import { useEarnTokenList } from "./hooks/useEarnTokenList"
import type { Vault } from "./types"

interface EarnDepositDialogProps {
  open: boolean
  onClose: () => void
  vault: Vault
  userAddress: string | undefined
  userChainType: AuthMethod | undefined
  signMessage: (
    params: walletMessage.WalletMessage
  ) => Promise<walletMessage.WalletSignatureResult | null>
  onSuccess?: () => void
}

export default function EarnDepositDialog({
  open,
  onClose,
  vault,
  userAddress,
  userChainType,
  signMessage,
  onSuccess,
}: EarnDepositDialogProps) {
  const { smUsdcToken, selectableTokens } = useEarnTokenList()

  // Find the token info for the vault's token (e.g., USDC)
  const vaultToken = useMemo(
    () => selectableTokens.find((t) => t.symbol === vault.token),
    [vault.token, selectableTokens]
  )

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
                <ModalStoreProvider>
                  <TokensStoreProvider>
                    <TokenListUpdater tokenList={selectableTokens} />
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
                          Deposit to Vault
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

                    <div className="mt-4">
                      <EarnFormProvider>
                        <EarnUIMachineProvider
                          mode="deposit"
                          tokenList={tokenList}
                          smUsdcToken={smUsdcToken}
                          signMessage={signMessage}
                        >
                          <EarnSwapForm
                            mode="deposit"
                            userAddress={userAddress}
                            userChainType={userChainType}
                            onSuccess={handleSuccess}
                            selectableTokens={selectableTokens}
                            submitLabel="Deposit"
                          />
                        </EarnUIMachineProvider>
                      </EarnFormProvider>
                    </div>

                    <ProjectedEarnings apy={vault.apy} />

                    <ModalContainer />
                  </TokensStoreProvider>
                </ModalStoreProvider>
              </Dialog.Content>
            </div>
          </div>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ProjectedEarnings({ apy }: { apy: number }) {
  return (
    <div className="mt-4 bg-gray-50 rounded-2xl p-4 space-y-3">
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        Projected Earnings on $1,000
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Monthly</span>
        <span className="font-semibold text-gray-900">
          {formatUsdAmount((1000 * apy) / 100 / 12)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Yearly</span>
        <span className="font-semibold text-gray-900">
          {formatUsdAmount((1000 * apy) / 100)}
        </span>
      </div>
    </div>
  )
}
