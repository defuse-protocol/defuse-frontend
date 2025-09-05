"use client"

import { NearConnector } from "@hot-labs/near-connect"
import type {
  SignMessageParams,
  SignedMessage,
} from "@near-wallet-selector/core/src/lib/wallet/wallet.types"
import { base58, base64 } from "@scure/base"
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
    const connector = new NearConnector({
      network: "mainnet",
      walletConnect: getDomainMetadataParams(whitelabelTemplate),
    })

    setConnector(connector)
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
      alert("Failed to initialize NEAR wallet")
    })
  }, [init])

  useEffect(() => {
    if (connector) {
      checkExistingWallet()
    }
  }, [connector, checkExistingWallet])

  useEffect(() => {
    if (!connector) return
    const onSignOut = () => setAccountId(null)
    const onSignIn = (t: { accounts: { accountId: string }[] }) =>
      setAccountId(t.accounts?.[0]?.accountId ?? null)
    connector.on("wallet:signOut", onSignOut)
    connector.on("wallet:signIn", onSignIn)
    return () => {
      connector.off("wallet:signOut", onSignOut)
      connector.off("wallet:signIn", onSignIn)
    }
  }, [connector])

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

      // TODO: This is a temporary workaround until Intear Wallet updates are included in @hot-labs/near-connect package to follow the standard signature format
      // Intear Wallet returns base58 encoded signatures with `ed25519:` prefix, but we expect base64 encoded signatures
      if (wallet.manifest.id === "intear-wallet") {
        const rawSignature = base58.decode(
          signatureData.signature.replace("ed25519:", "")
        )
        Object.assign(signatureData, {
          signature: base64.encode(new Uint8Array(rawSignature)),
        })
      }

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
