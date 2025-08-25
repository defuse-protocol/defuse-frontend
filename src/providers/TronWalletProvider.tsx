"use client"

import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks"
import { WalletProvider } from "@tronweb3/tronwallet-adapter-react-hooks"
import { TronLinkAdapter } from "@tronweb3/tronwallet-adapter-tronlink"
import { createContext, useCallback, useContext, useState } from "react"

interface TronContextType {
  publicKey: string | null
  isLoading: boolean
  error: string | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<string>
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
      "https://chromewebstore.google.com/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec?hl=en-US&utm_source=ext_sidebar",
      "_blank"
    )
  }, [])

  const handleConnect = async (): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.tronLink) {
        const tronLinkWallet = wallets.find(
          (w) => w.adapter.name === "TronLink"
        )
        if (tronLinkWallet) {
          await select(tronLinkWallet.adapter.name)
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
  }

  const handleDisconnect = async (): Promise<void> => {
    setError(null)

    try {
      await disconnect()
      setError(null)
    } catch (err) {
      setError(`Disconnection error: ${getErrorMessage(err)}`)
    }
  }

  const handleSignMessage = async (message: string) => {
    setError(null)

    try {
      const signature = await signMessage(message)
      return signature
    } catch (error) {
      setError(`Signing error: ${getErrorMessage(error)}`)
      throw error
    }
  }

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: TronContextType = {
    publicKey: address,
    isConnected: connected,
    isLoading: connecting || disconnecting,
    error,
    connect: handleConnect,
    disconnect: handleDisconnect,
    signMessage: handleSignMessage,
    clearError,
    installWallet,
  }

  return <TronContext.Provider value={value}>{children}</TronContext.Provider>
}

export function useTronWallet() {
  const context = useContext(TronContext)
  if (!context) {
    throw new Error("useTronWallet must be used within a TronProvider")
  }
  return context
}
