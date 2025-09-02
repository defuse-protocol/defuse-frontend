"use client"

import { NearConnector } from "@hot-labs/near-connect"
import type { FinalExecutionOutcome } from "@near-wallet-selector/core"
import type {
  SignMessageParams,
  SignedMessage,
} from "@near-wallet-selector/core/src/lib/wallet/wallet.types"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import type { SignAndSendTransactionsParams } from "@src/types/interfaces"
import { logger } from "@src/utils/logger"
import { getDomainMetadataParams } from "@src/utils/whitelabelDomainMetadata"
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
  ) => Promise<FinalExecutionOutcome[]>
}

export const NearWalletContext = createContext<NearWalletContextValue | null>(
  null
)

export const NearWalletProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [connector, setConnector] = useState<NearConnector | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  const init = useCallback(async () => {
    const _connector = new NearConnector({
      network: "mainnet",
      walletConnect: {
        ...getDomainMetadataParams(whitelabelTemplate),
      },
    })

    setConnector(_connector)
  }, [whitelabelTemplate])

  const checkExistingWallet = useCallback(async () => {
    if (!connector) return
    try {
      const wallet = await connector.wallet()
      const accountId = await wallet.getAddress()
      if (accountId) {
        setAccountId(accountId as string)
      }
    } catch {} // No existing wallet connection found
  }, [connector])

  useEffect(() => {
    init().catch((err) => {
      logger.error(err)
      alert("Failed to initialise wallet selector")
    })
  }, [init])

  useEffect(() => {
    if (connector) {
      checkExistingWallet()
    }
  }, [connector, checkExistingWallet])

  connector?.on("wallet:signOut", async () => {
    setAccountId(null)
  })

  connector?.on("wallet:signIn", async (t) => {
    const address = t.accounts[0].accountId
    setAccountId(address)
  })

  const connect = useCallback(async () => {
    if (!connector) return
    await connector.connect()
  }, [connector])

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
      return {
        signatureData,
        signedData: message,
      }
    },
    [connector]
  )

  const signAndSendTransactions = useCallback(
    async (params: SignAndSendTransactionsParams) => {
      if (!connector) {
        throw new Error("Connector not initialized")
      }
      const wallet = await connector.wallet()
      return await wallet.signAndSendTransactions(params)
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
