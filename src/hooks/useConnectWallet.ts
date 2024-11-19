"use client"

import type { FinalExecutionOutcome } from "@near-wallet-selector/core"
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import type {
  SendTransactionEVMParams,
  SignAndSendTransactionsParams,
} from "@src/types/interfaces"
import type { SendTransactionParameters } from "@wagmi/core"
import { useCallback, useEffect, useState } from "react"
import { type Connector, useAccount, useConnect, useDisconnect } from "wagmi"
import { useEVMWalletActions } from "./useEVMWalletActions"
import { useNearWalletActions } from "./useNearWalletActions"

export enum ChainType {
  Near = "near",
  EVM = "evm",
  Solana = "sol",
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
  signMessage: (params: { id: ChainType; message: string }) => Promise<void>
  sendTransaction: (params: {
    id: ChainType
    tx?:
      | SignAndSendTransactionsParams["transactions"]
      | SendTransactionEVMParams["transactions"]
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
  const [state, setState] = useState<State>(defaultState)

  /**
   * NEAR:
   * Down below are Near Wallet handlers and actions
   */
  const nearWallet = useWalletSelector()
  const { signAndSendTransactions } = useNearWalletActions()

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

  const handleSignInViaSolanaSelector = async () => {
    setVisible(true)
  }

  const handleSignOutViaSolanaSelector = useCallback(async () => {
    await solanaWallet.disconnect()
  }, [solanaWallet])

  /**
   * Set the state based on the current wallet connection.
   * All wallets connection should be handled here.
   */
  useEffect(() => {
    if (
      !nearWallet.accountId &&
      !evmWalletAccount.address &&
      !solanaWallet.publicKey
    ) {
      // Reset the state if all wallets are disconnected
      return setState(defaultState)
    }
    if (nearWallet.accountId != null) {
      setState({
        address: nearWallet.accountId,
        network: "near:mainnet",
        chainType: ChainType.Near,
      })
    } else if (evmWalletAccount.address != null && evmWalletAccount.chain) {
      setState({
        address: evmWalletAccount.address,
        network: evmWalletAccount.chain.id
          ? `eth:${evmWalletAccount.chain.id}`
          : "unknown",
        chainType: ChainType.EVM,
      })
    } else if (solanaWallet.publicKey != null) {
      setState({
        address: solanaWallet.publicKey.toBase58(),
        network: "sol:mainnet",
        chainType: ChainType.Solana,
      })
    }
  }, [
    nearWallet.accountId,
    evmWalletAccount.address,
    evmWalletAccount.chain,
    solanaWallet.publicKey,
  ])

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

    // TODO: Implement this
    signMessage: async ({
      id,
      message,
    }: { id: ChainType; message: string }) => {},

    sendTransaction: async (
      params
    ): Promise<string | FinalExecutionOutcome[]> => {
      const strategies = {
        [ChainType.Near]: async () =>
          await signAndSendTransactions({
            transactions:
              params.tx as SignAndSendTransactionsParams["transactions"],
          }),
        [ChainType.EVM]: async () =>
          await sendTransactions(params.tx as SendTransactionParameters),
        [ChainType.Solana]: async () => {
          throw new Error("Solana transaction not implemented")
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
