"use client"

import {
  FREIGHTER_ID,
  HOTWALLET_ID,
  LOBSTR_ID,
  StellarWalletsKit,
  WalletNetwork,
  XBULL_ID,
  allowAllModules,
} from "@creit.tech/stellar-wallets-kit"
import { base64 } from "@scure/base"
import { logger } from "@src/utils/logger"
import { Horizon, Networks, TransactionBuilder } from "@stellar/stellar-sdk"
import { createContext, useContext, useEffect, useState } from "react"

interface StellarWalletContextType {
  publicKey: string | null
  isLoading: boolean
  error: string | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  fetchPublicKey: () => Promise<void>
  resetPublicKey: () => void
  clearError: () => void
}

const StellarWalletContext = createContext<StellarWalletContextType | null>(
  null
)

let kit: StellarWalletsKit | null = null

function getKit() {
  if (!kit) {
    kit = new StellarWalletsKit({
      modules: allowAllModules({
        // TODO: Remove this once we will support all Stellar wallets signature format
        filterBy: (module) =>
          module.productId === FREIGHTER_ID ||
          module.productId === HOTWALLET_ID ||
          module.productId === XBULL_ID ||
          module.productId === LOBSTR_ID,
      }),
      network: WalletNetwork.PUBLIC,
      selectedWalletId: getSelectedWalletId() ?? FREIGHTER_ID,
    })
  }
  return kit
}

export const signTransactionStellar = async (
  ...args: Parameters<StellarWalletsKit["signTransaction"]>
) => getKit().signTransaction(...args)

export const submitTransactionStellar = async (signedTxXdr: string) => {
  const server = new Horizon.Server("https://horizon.stellar.org")
  const transaction = TransactionBuilder.fromXDR(signedTxXdr, Networks.PUBLIC)
  const response = await server.submitTransaction(transaction)
  return response.hash
}

export const signMessageStellar = async (
  message: string
): Promise<Uint8Array> => {
  const k = getKit()
  const { signedMessage } = await k.signMessage(message)
  return base64.decode(signedMessage)
}

export async function getPublicKeyStellar() {
  if (!getSelectedWalletId()) return null
  const { address } = await getKit().getAddress()
  return address
}

const STELLAR_SELECTED_WALLET_ID = "stellar-selected-wallet-id"

function getSelectedWalletId() {
  return localStorage.getItem(STELLAR_SELECTED_WALLET_ID)
}

export async function setWalletStellar(walletId: string) {
  localStorage.setItem(STELLAR_SELECTED_WALLET_ID, walletId)
  await getKit().setWallet(walletId)
}

export async function disconnectStellar() {
  localStorage.removeItem(STELLAR_SELECTED_WALLET_ID)
  await getKit().disconnect()
}

export async function connectStellar(): Promise<void> {
  return new Promise((resolve, reject) => {
    getKit().openModal({
      onWalletSelected: async (option) => {
        try {
          await setWalletStellar(option.id as string)
          resolve()
        } catch (error) {
          logger.warn("Error connecting Stellar wallet")
          reject(error)
        }
        return option.id
      },
    })
  })
}

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error)
}

export function StellarWalletProvider({
  children,
}: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPublicKey = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const key = await getPublicKeyStellar()
      setPublicKey(key)
    } catch (err) {
      setError(getErrorMessage(err))
      setPublicKey(null)
    } finally {
      setIsLoading(false)
    }
  }

  const resetPublicKey = () => {
    setPublicKey(null)
    setError(null)
    setIsLoading(false)
  }

  const clearError = () => {
    setError(null)
  }

  const connect = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await connectStellar()
      await fetchPublicKey()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = async () => {
    setIsLoading(true)

    try {
      await disconnectStellar()
      resetPublicKey()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize wallet state on mount
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      if (!isMounted) return
      setIsLoading(true)

      try {
        const key = await getPublicKeyStellar()
        if (isMounted) {
          setPublicKey(key)
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [])

  const value: StellarWalletContextType = {
    publicKey,
    isLoading,
    error,
    isConnected: !!publicKey,
    connect,
    disconnect,
    fetchPublicKey,
    resetPublicKey,
    clearError,
  }

  return (
    <StellarWalletContext.Provider value={value}>
      {children}
    </StellarWalletContext.Provider>
  )
}

export function useStellarWallet() {
  const context = useContext(StellarWalletContext)
  if (!context) {
    throw new Error(
      "useStellarWallet must be used within a StellarWalletProvider"
    )
  }
  return context
}
