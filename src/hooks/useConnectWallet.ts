"use client"

import type { FinalExecutionOutcome } from "@near-wallet-selector/core"
import {
  useConnection as useSolanaConnection,
  useWallet as useSolanaWallet,
} from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import type {
  SendTransactionEVMParams,
  SendTransactionSolanaParams,
  SignAndSendTransactionsParams,
} from "@src/types/interfaces"
import type { SendTransactionParameters } from "@wagmi/core"
import { useCallback, useEffect } from "react"
import { type Connector, useAccount, useConnect, useDisconnect } from "wagmi"
import { useEVMWalletActions } from "./useEVMWalletActions"
import { useNearWalletActions } from "./useNearWalletActions"

export enum ChainType {
  Near = "near",
  EVM = "evm",
  Solana = "solana",
}

type State = {
  chainType?: ChainType
  network?: string
  address?: string
}

interface ConnectWalletAction {
  signIn: (params: {
    id: ChainType
    connector?: Connector
  }) => Promise<void>
  signOut: (params: { id: ChainType }) => Promise<void>
  sendTransaction: (params: {
    id: ChainType
    tx?:
      | SignAndSendTransactionsParams["transactions"]
      | SendTransactionEVMParams["transactions"]
      | SendTransactionSolanaParams["transactions"]
  }) => Promise<string | FinalExecutionOutcome[]>
  connectors: Connector[]
  state: State
}

const defaultState: State = {
  chainType: undefined,
  network: undefined,
  address: undefined,
}

const NEXT_PUBLIC_SOLANA_ENABLED =
  process?.env?.NEXT_PUBLIC_SOLANA_ENABLED === "true"

export const useConnectWallet = (): ConnectWalletAction => {
  let state: State = defaultState

  /**
   * NEAR:
   * Down below are Near Wallet handlers and actions
   */
  const nearWallet = useWalletSelector()
  const nearWalletConnect = useNearWalletActions()

  const handleSignInViaNearWalletSelector = async (): Promise<void> => {
    nearWallet.modal.show()
  }
  const handleSignOutViaNearWalletSelector = async () => {
    try {
      const wallet = await nearWallet.selector.wallet()
      await wallet.signOut()
    } catch (e) {
      console.log("Failed to sign out", e)
    }
  }

  /**
   * EVM:
   * Down below are Wagmi Wallet handlers and actions
   */
  const evmWalletConnect = useConnect()
  const evmWalletDisconnect = useDisconnect()
  const evmWalletAccount = useAccount()
  const { sendTransactions } = useEVMWalletActions()

  const handleSignInViaWalletConnect = async ({
    connector,
  }: {
    connector: Connector
  }): Promise<void> => {
    if (!connector) {
      throw new Error("Invalid connector")
    }
    evmWalletConnect.connect({ connector })
  }
  const handleSignOutViaWalletConnect = async () => {
    await evmWalletDisconnect.disconnect()
  }

  /**
   * Solana:
   * Down below are Solana Wallet handlers and actions
   */
  const { setVisible } = useWalletModal()
  const solanaWallet = useSolanaWallet()
  const solanaConnection = useSolanaConnection()
  const handleSignInViaSolanaSelector = async () => {
    setVisible(true)
  }

  const handleSignOutViaSolanaSelector = useCallback(async () => {
    await solanaWallet.disconnect()
  }, [solanaWallet])

  if (nearWallet.accountId != null) {
    state = {
      address: nearWallet.accountId,
      network: "near:mainnet",
      chainType: ChainType.Near,
    }
  }

  if (evmWalletAccount.address != null && evmWalletAccount.chain) {
    state = {
      address: evmWalletAccount.address,
      network: evmWalletAccount.chain.id
        ? `eth:${evmWalletAccount.chain.id}`
        : "unknown",
      chainType: ChainType.EVM,
    }
  }

  /**
   * Ensure Solana Wallet state overrides EVM Wallet state:
   * Context:
   *   Phantom Wallet supports both Solana and EVM chains.
   * Issue:
   *   When Phantom Wallet connects, it may emit an EVM connection event.
   *   This causes `wagmi` to connect to the EVM chain, leading to unexpected
   *   address switching. Placing Solana Wallet state last prevents this.
   */
  if (solanaWallet.publicKey != null) {
    state = {
      address: solanaWallet.publicKey.toBase58(),
      network: "sol:mainnet",
      chainType: ChainType.Solana,
    }
  }

  /**
   * This hook is used to disconnect the wallet under the feature flag is off
   * to prevent reconnections again in the next session
   */
  useEffect(() => {
    if (!NEXT_PUBLIC_SOLANA_ENABLED) {
      handleSignOutViaSolanaSelector()
    }
  }, [handleSignOutViaSolanaSelector])

  return {
    async signIn(params: {
      id: ChainType
      connector?: Connector
    }): Promise<void> {
      const strategies = {
        [ChainType.Near]: () => handleSignInViaNearWalletSelector(),
        [ChainType.EVM]: () =>
          params.connector
            ? handleSignInViaWalletConnect({ connector: params.connector })
            : undefined,
        [ChainType.Solana]: () => handleSignInViaSolanaSelector(),
      }
      return strategies[params.id]()
    },

    async signOut(params: {
      id: ChainType
    }): Promise<void> {
      const strategies = {
        [ChainType.Near]: () => handleSignOutViaNearWalletSelector(),
        [ChainType.EVM]: () => handleSignOutViaWalletConnect(),
        [ChainType.Solana]: () => handleSignOutViaSolanaSelector(),
      }
      return strategies[params.id]()
    },

    sendTransaction: async (
      params
    ): Promise<string | FinalExecutionOutcome[]> => {
      const strategies = {
        [ChainType.Near]: async () =>
          await nearWalletConnect.signAndSendTransactions({
            transactions:
              params.tx as SignAndSendTransactionsParams["transactions"],
          }),

        [ChainType.EVM]: async () =>
          await sendTransactions(params.tx as SendTransactionParameters),

        [ChainType.Solana]: async () => {
          const transaction =
            params.tx as SendTransactionSolanaParams["transactions"]
          return await solanaWallet.sendTransaction(
            transaction,
            solanaConnection.connection
          )
        },
      }

      const result = await strategies[params.id]()
      if (result === undefined) {
        throw new Error(`Transaction failed for ${params.id}`)
      }
      return result
    },

    connectors: evmWalletConnect.connectors as Connector[],
    state,
  }
}
