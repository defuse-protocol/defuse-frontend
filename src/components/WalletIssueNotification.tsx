"use client"

import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { Cross2Icon, ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Button, AlertDialog as themes_AlertDialog } from "@radix-ui/themes"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import type React from "react"

const WalletIssueNotification: React.FC = () => {
  const searchParams = useSearchParams()
  const [selectedWalletName, setSelectedWalletName] = useState<string | null>(
    null
  )
  const { connector } = useNearWallet()
  const { state, signOut } = useConnectWallet()

  useEffect(() => {
    if (!connector || state.chainType !== ChainType.Near) {
      return setSelectedWalletName(null)
    }
    const fetchWalletName = async () => {
      const walletName = (await connector.wallet()).manifest.name
      setSelectedWalletName(walletName)
    }
    fetchWalletName()
  }, [connector, state])

  if (
    selectedWalletName !== "MyNearWallet" ||
    searchParams.get("mynearwallet")
  ) {
    return null
  }

  return (
    <WalletIssueDialog
      open={true}
      onCancel={() => {
        if (state.chainType != null) {
          void signOut({ id: state.chainType })
        }
      }}
    />
  )
}

export function WalletIssueDialog({
  open,
  onCancel,
}: {
  open: boolean
  onCancel: () => void
}) {
  return (
    <AlertDialog.Root open={open}>
      <themes_AlertDialog.Content className="max-w-md p-6 sm:animate-none animate-slide-up">
        <>
          {/* Header Section */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-full mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              MyNearWallet Issue Detected
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-gray-11">
              Please try again later or connect a different wallet.
            </AlertDialog.Description>
          </div>

          {/* Info List */}
          <div className="bg-gray-50 dark:bg-gray-800 text-gray-11 rounded-lg p-4 mb-5">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 dark:bg-amber-900 rounded-full p-1 mt-0.5">
                  <Cross2Icon className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm">
                  Due to a signing requests issue on swaps and withdrawals we
                  temporarily disabled this wallet.
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col justify-center gap-3 mt-6">
            <themes_AlertDialog.Cancel>
              <Button
                size="4"
                type="button"
                variant="soft"
                color="gray"
                onClick={onCancel}
              >
                Disconnect
              </Button>
            </themes_AlertDialog.Cancel>
          </div>
        </>
      </themes_AlertDialog.Content>
    </AlertDialog.Root>
  )
}

export default WalletIssueNotification
