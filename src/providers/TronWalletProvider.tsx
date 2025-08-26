"use client"

import type { Transaction as TransactionTron } from "@tronweb3/tronwallet-abstract-adapter"
import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks"
import { WalletProvider } from "@tronweb3/tronwallet-adapter-react-hooks"
import { TronLinkAdapter } from "@tronweb3/tronwallet-adapter-tronlink"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

interface TronContextType {
  publicKey: string | null
  isLoading: boolean
  error: string | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<string>
  sendTransaction: (params: {
    transaction: TransactionTron
  }) => Promise<string>
  clearError: () => void
  installWallet: () => void
}

const TronContext = createContext<TronContextType | null>(null)

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error)
}

export function TronWalletProvider({
  children,
}: { children: React.ReactNode }) {
  return (
    <WalletProvider adapters={[new TronLinkAdapter()]} autoConnect={true}>
      <TronProviderInner>{children}</TronProviderInner>
    </WalletProvider>
  )
}

function TronProviderInner({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null)

  const {
    connect,
    disconnect,
    signMessage,
    signTransaction,
    connected,
    address,
    connecting,
    disconnecting,
    wallets,
    select,
  } = useWallet()

  const installWallet = useCallback(() => {
    // Open TronLink extension store
    window.open(
      "https://chromewebstore.google.com/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec",
      "_blank"
    )
  }, [])

  const handleConnect = useCallback(async (): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.tronLink) {
        const tronLinkWallet = wallets.find(
          (w) => w.adapter.name === "TronLink"
        )
        if (tronLinkWallet) {
          select(tronLinkWallet.adapter.name)
          await connect()
        } else {
          setError("TronLink wallet not found. Please install TronLink.")
        }
      } else {
        setError("TronLink extension not found. Please install TronLink.")
        installWallet()
      }
    } catch (err) {
      setError(`Failed to initialize TronLink: ${getErrorMessage(err)}`)
    }
  }, [connect, installWallet, select, wallets])

  const handleDisconnect = useCallback(async (): Promise<void> => {
    setError(null)
    try {
      await disconnect()
      setError(null)
    } catch (err) {
      setError(`Disconnection error: ${getErrorMessage(err)}`)
    }
  }, [disconnect])

  const handleSignMessage = useCallback(
    async (message: string) => {
      setError(null)
      try {
        const signature = await signMessage(message)
        return signature
      } catch (error) {
        setError(`Signing error: ${getErrorMessage(error)}`)
        throw error
      }
    },
    [signMessage]
  )

  const handleSendTransaction = useCallback(
    async (params: {
      transaction: TransactionTron
    }) => {
      setError(null)
      try {
        const tx = await signTransaction(params.transaction)
        return tx.txid
      } catch (error) {
        setError(`Transaction error: ${getErrorMessage(error)}`)
        throw error
      }
    },
    [signTransaction]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = useMemo((): TronContextType => {
    return {
      publicKey: address,
      isConnected: connected,
      isLoading: connecting || disconnecting,
      error,
      connect: handleConnect,
      disconnect: handleDisconnect,
      signMessage: handleSignMessage,
      sendTransaction: handleSendTransaction,
      clearError,
      installWallet,
    }
  }, [
    address,
    connected,
    connecting,
    disconnecting,
    error,
    handleConnect,
    handleDisconnect,
    handleSignMessage,
    handleSendTransaction,
    clearError,
    installWallet,
  ])

  return <TronContext.Provider value={value}>{children}</TronContext.Provider>
}

export function useTronWallet() {
  const context = useContext(TronContext)
  if (!context) {
    throw new Error("useTronWallet must be used within a TronProvider")
  }
  return context
}
