"use client"

import type { NearConnector } from "@hot-labs/near-connect"
import type {
  SignMessageParams,
  SignedMessage,
} from "@near-wallet-selector/core/src/lib/wallet/wallet.types"
import { ChainType } from "@src/hooks/useConnectWallet"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import type { SignAndSendTransactionsParams } from "@src/types/interfaces"
import { logger } from "@src/utils/logger"
import { getDomainMetadataParams } from "@src/utils/whitelabelDomainMetadata"
import type { providers } from "near-api-js"
import {
  type FC,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

interface NearWalletContextValue {
  connector: NearConnector | null
  accountId: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: SignMessageParams) => Promise<{
    signatureData: SignedMessage
    signedData: SignMessageParams
  }>
  signAndSendTransactions: (
    params: SignAndSendTransactionsParams
  ) => Promise<providers.FinalExecutionOutcome[]>
}

const NearWalletContext = createContext<NearWalletContextValue | null>(null)

export const NearWalletProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [connector, setConnector] = useState<NearConnector | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  const init = useCallback(async () => {
    if (connector) {
      return connector
    }

    const { NearConnector } = await import(
      "@hot-labs/near-connect/build/NearConnector"
    )

    let newConnector: NearConnector | null = null

    try {
      newConnector = new NearConnector({
        network: "mainnet",
        walletConnect: getDomainMetadataParams(whitelabelTemplate),
      })
    } catch (err) {
      logger.error(err)
      alert("Failed to initialize NEAR wallet")
      return
    }

    newConnector.on("wallet:signOut", () => setAccountId(null))
    newConnector.on("wallet:signIn", (t) => {
      setAccountId(t.accounts?.[0]?.accountId ?? null)
    })

    setConnector(newConnector)

    try {
      const wallet = await newConnector.wallet()
      const accountId = await wallet.getAddress()
      if (accountId) {
        setAccountId(accountId)
      }
    } catch {} // No existing wallet connection found

    return newConnector
  }, [connector, whitelabelTemplate])

  useEffect(() => {
    const prevChainType = localStorage.getItem("chainType")
    if (prevChainType === ChainType.Near) {
      init()
    }
  }, [init])

  const connect = useCallback(async () => {
    const newConnector = connector ?? (await init())
    if (newConnector) {
      await newConnector.connect()
      localStorage.setItem("chainType", ChainType.Near)
    }
  }, [connector, init])

  const disconnect = useCallback(async () => {
    if (!connector) return
    await connector.disconnect()
  }, [connector])

  const signMessage = useCallback(
    async (message: SignMessageParams) => {
      if (!connector) {
        throw new Error("Connector not initialized")
      }
      const wallet = await connector.wallet()
      const signatureData = await wallet.signMessage(message)
      return { signatureData, signedData: message }
    },
    [connector]
  )

  const signAndSendTransactions = useCallback(
    async (params: SignAndSendTransactionsParams) => {
      if (!connector) {
        throw new Error("Connector not initialized")
      }
      const wallet = await connector.wallet()
      return wallet.signAndSendTransactions(params)
    },
    [connector]
  )

  const value = useMemo<NearWalletContextValue>(() => {
    return {
      connector,
      accountId,
      connect,
      disconnect,
      signMessage,
      signAndSendTransactions,
    }
  }, [
    connector,
    accountId,
    connect,
    disconnect,
    signMessage,
    signAndSendTransactions,
  ])

  return (
    <NearWalletContext.Provider value={value}>
      {children}
    </NearWalletContext.Provider>
  )
}

export function useNearWallet() {
  const ctx = useContext(NearWalletContext)
  if (!ctx) {
    throw new Error("useNearWallet must be used within a NearWalletProvider")
  }
  return ctx
}
