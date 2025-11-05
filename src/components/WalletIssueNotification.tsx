"use client"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import type React from "react"

const STORAGE_KEY = "mynearwallet-wallet-issue-notification-dismissed"

const WalletIssueNotification: React.FC = () => {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [selectedWalletName, setSelectedWalletName] = useState<string | null>(
    null
  )
  const { connector } = useNearWallet()
  const { state } = useConnectWallet()

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

  // Only show on deposit, withdraw and swap pages
  const shouldShowNotification =
    pathname === "/deposit" || pathname === "/withdraw" || pathname === "/"

  useEffect(() => {
    // Check if notification was previously dismissed in this session
    const wasDismissed = sessionStorage.getItem(STORAGE_KEY) === "true"
    if (wasDismissed) {
      setIsVisible(false)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    sessionStorage.setItem(STORAGE_KEY, "true")
  }

  if (
    !isVisible ||
    !shouldShowNotification ||
    selectedWalletName !== "MyNearWallet"
  ) {
    return null
  }

  return (
    <div className="bg-amber-500 text-amber-900 px-3 py-2 text-center text-xs font-medium border-b border-amber-600">
      <div className="flex items-center justify-center gap-2 relative">
        <svg
          className="w-3 h-3 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-label="Warning"
        >
          <title>Warning</title>
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          <strong>MyNearWallet Wallet Issue:</strong> Swaps and withdrawals
          requests may not go through. Please use a different Near wallet.
        </span>
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-0 p-0.5 hover:bg-yellow-600 rounded-full transition-colors"
          aria-label="Close notification"
        >
          <svg
            className="w-3 h-3"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-label="Close"
          >
            <title>Close</title>
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default WalletIssueNotification
