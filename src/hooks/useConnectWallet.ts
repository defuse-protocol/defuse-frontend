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
import {
  type Connector,
  useAccount,
  useConnect,
  useConnections,
  useDisconnect,
} from "wagmi"
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
  const evmWalletConnections = useConnections()
  const { sendTransactions } = useEVMWalletActions()

  const handleSignInViaWagmi = async ({
    connector,
  }: {
    connector: Connector
  }): Promise<void> => {
    if (!connector) {
      throw new Error("Invalid connector")
    }
    evmWalletConnect.connect({ connector })
  }
  const handleSignOutViaWagmi = async () => {
    for (const { connector } of evmWalletConnections) {
      evmWalletDisconnect.disconnect({ connector })
    }
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

  const handleSignOutViaSolanaSelector = async () => {
    await solanaWallet.disconnect()

    // Issue: Phantom wallet also connects EVM wallet when it connects Solana wallet
    await handleSignOutViaWagmi()
  }

  if (nearWallet.accountId != null) {
    state = {
      address: nearWallet.accountId,
      network: "near:mainnet",
      chainType: ChainType.Near,
    }
  }

  // We check `account.chainId` instead of `account.chain` to determine if
  // the user is connected. This is because the user might be connected to
  // an unsupported chain (so `.chain` will undefined), but we still want
  // to recognize that their wallet is connected.
  if (evmWalletAccount.address != null && evmWalletAccount.chainId) {
    state = {
      address: evmWalletAccount.address,
      network: evmWalletAccount.chainId
        ? `eth:${evmWalletAccount.chainId}`
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

  return {
    async signIn(params: {
      id: ChainType
      connector?: Connector
    }): Promise<void> {
      const strategies = {
        [ChainType.Near]: () => handleSignInViaNearWalletSelector(),
        [ChainType.EVM]: () =>
          params.connector
            ? handleSignInViaWagmi({ connector: params.connector })
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
        [ChainType.EVM]: () => handleSignOutViaWagmi(),
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
