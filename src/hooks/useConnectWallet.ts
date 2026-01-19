"use client"

import type { FinalExecutionOutcome } from "@near-wallet-selector/core"
import {
  useConnection as useSolanaConnection,
  useWallet as useSolanaWallet,
} from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { BaseError } from "@src/components/DefuseSDK/errors/base"
import type {
  SendTransactionStellarParams,
  SendTransactionTronParams,
} from "@src/components/DefuseSDK/types/deposit"
import {
  useWebAuthnActions,
  useWebAuthnCurrentCredential,
  useWebAuthnUIStore,
} from "@src/features/webauthn/hooks/useWebAuthnStore"
import { useAppAuthToken } from "@src/hooks/useAppAuthToken"
import { useSignInLogger } from "@src/hooks/useSignInLogger"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import {
  signTransactionStellar,
  submitTransactionStellar,
  useStellarWallet,
} from "@src/providers/StellarWalletProvider"
import { useTronWallet } from "@src/providers/TronWalletProvider"
import { useVerifiedWalletsStore } from "@src/stores/useVerifiedWalletsStore"
import type {
  SendTransactionEVMParams,
  SendTransactionSolanaParams,
  SendTransactionTonParams,
  SignAndSendTransactionsParams,
} from "@src/types/interfaces"
import { parseTonAddress } from "@src/utils/parseTonAddress"
import { Cell } from "@ton/ton"
import {
  useTonConnectModal,
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react"
import type { SendTransactionResponse } from "@tonconnect/ui-react"
import type { SendTransactionParameters } from "@wagmi/core"
import { useSearchParams } from "next/navigation"
import { useCallback } from "react"
import {
  type Connector,
  useAccount,
  useConnect,
  useConnections,
  useDisconnect,
} from "wagmi"
import { useEVMWalletActions } from "./useEVMWalletActions"

export enum ChainType {
  Near = "near",
  EVM = "evm",
  Solana = "solana",
  WebAuthn = "webauthn",
  Ton = "ton",
  Stellar = "stellar",
  Tron = "tron",
}

export type State = {
  chainType?: ChainType
  network?: string
  address?: string
  displayAddress?: string
  isVerified: boolean
  isFake: boolean // in most cases, this is used for testing purposes only
}

interface ConnectWalletAction {
  signIn: (params: { id: ChainType; connector?: Connector }) => Promise<void>
  signOut: (params: { id: ChainType }) => Promise<void>
  sendTransaction: (params: {
    id: ChainType
    tx?:
      | SignAndSendTransactionsParams["transactions"]
      | SendTransactionEVMParams["transactions"]
      | SendTransactionSolanaParams["transactions"]
      | SendTransactionTonParams["transactions"]
      | SendTransactionStellarParams
      | SendTransactionTronParams
  }) => Promise<string | FinalExecutionOutcome[] | SendTransactionResponse>
  connectors: Connector[]
  state: State
  /** True when any wallet adapter is in a connecting/reconnecting state */
  isLoading: boolean
}

const defaultState: State = {
  chainType: undefined,
  network: undefined,
  address: undefined,
  displayAddress: undefined,
  isVerified: false,
  isFake: false,
}

export const useConnectWallet = (): ConnectWalletAction => {
  let state: State = defaultState

  /**
   * NEAR:
   * Down below are Near Wallet handlers and actions
   */
  const nearWallet = useNearWallet()

  if (nearWallet.accountId != null) {
    state = {
      address: nearWallet.accountId,
      displayAddress: nearWallet.accountId,
      network: "near:mainnet",
      chainType: ChainType.Near,
      isVerified: false,
      isFake: false,
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
    await evmWalletConnect.connectAsync({ connector })
  }
  const handleSignOutViaWagmi = async () => {
    const evmWalletDisconnects = evmWalletConnections.map(({ connector }) => {
      if (evmWalletDisconnect.disconnectAsync) {
        return evmWalletDisconnect.disconnectAsync({ connector })
      }
      // Fallback: wrap the void‐returning call so it can be awaited
      return Promise.resolve(evmWalletDisconnect.disconnect({ connector }))
    })
    await Promise.all(evmWalletDisconnects)
  }

  // We check `account.chainId` instead of `account.chain` to determine if
  // the user is connected. This is because the user might be connected to
  // an unsupported chain (so `.chain` will undefined), but we still want
  // to recognize that their wallet is connected.
  if (evmWalletAccount.address != null && evmWalletAccount.chainId) {
    state = {
      address: evmWalletAccount.address,
      displayAddress: evmWalletAccount.address,
      network: evmWalletAccount.chainId
        ? `eth:${evmWalletAccount.chainId}`
        : "unknown",
      chainType: ChainType.EVM,
      isVerified: false,
      isFake: false,
    }
  }

  /**
   * Solana:
   * Down below are Solana Wallet handlers and actions
   *
   * Ensure Solana Wallet state overrides EVM Wallet state:
   * Context:
   *   Phantom Wallet supports both Solana and EVM chains.
   * Issue:
   *   When Phantom Wallet connects, it may emit an EVM connection event.
   *   This causes `wagmi` to connect to the EVM chain, leading to unexpected
   *   address switching. Placing Solana Wallet state last prevents this.
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

  if (solanaWallet.publicKey != null) {
    state = {
      address: solanaWallet.publicKey.toBase58(),
      displayAddress: solanaWallet.publicKey.toBase58(),
      network: "sol:mainnet",
      chainType: ChainType.Solana,
      isVerified: false,
      isFake: false,
    }
  }

  /**
   * WebAuthn:
   * Down below are WebAuthn Wallet handlers and actions
   */
  const currentPasskey = useWebAuthnCurrentCredential()
  const webAuthnActions = useWebAuthnActions()
  const webAuthnUI = useWebAuthnUIStore()

  if (currentPasskey != null) {
    state = {
      address: currentPasskey.publicKey,
      displayAddress: currentPasskey.publicKey,
      chainType: ChainType.WebAuthn,
      isVerified: false,
      isFake: false,
    }
  }

  /**
   * TON:
   * Down below are TON Wallet handlers and actions
   */
  const tonWallet = useTonWallet()
  const tonConnectModal = useTonConnectModal()
  const [tonConnectUI] = useTonConnectUI()

  if (tonWallet) {
    state = {
      address: tonWallet.account.publicKey,
      displayAddress: parseTonAddress(tonWallet.account.address),
      network: "ton",
      chainType: ChainType.Ton,
      isVerified: false,
      isFake: false,
    }
  }

  /**
   * Stellar:
   * Down below are Stellar Wallet handlers and actions
   */
  const {
    publicKey,
    connect,
    disconnect,
    isLoading: isStellarLoading,
  } = useStellarWallet()

  const handleSignInViaStellar = async (): Promise<void> => {
    await connect()
  }

  const handleSignOutViaStellar = async (): Promise<void> => {
    await disconnect()
  }

  if (publicKey) {
    state = {
      address: publicKey,
      displayAddress: publicKey,
      network: "stellar:mainnet",
      chainType: ChainType.Stellar,
      isVerified: false,
      isFake: false,
    }
  }

  /**
   * Tron:
   * Down below are Tron Wallet handlers and actions
   */
  const tronWallet = useTronWallet()

  const handleSignInViaTron = async (): Promise<void> => {
    await tronWallet.connect()
  }

  const handleSignOutViaTron = async (): Promise<void> => {
    await tronWallet.disconnect()
  }

  if (tronWallet.publicKey) {
    state = {
      address: tronWallet.publicKey,
      displayAddress: tronWallet.publicKey,
      network: "tron:mainnet",
      chainType: ChainType.Tron,
      isVerified: false,
      isFake: false,
    }
  }

  state.isVerified = useVerifiedWalletsStore(
    useCallback(
      (store) =>
        state.address != null
          ? store.walletAddresses.includes(state.address)
          : false,
      [state.address]
    )
  )

  useAppAuthToken(state.address, state.chainType)

  const impersonatedUser = useImpersonatedUser()
  if (impersonatedUser) {
    state = impersonatedUser
  }

  const { onSignOut } = useSignInLogger(
    state.address,
    state.chainType,
    state.isVerified
  )

  const isLoading =
    evmWalletAccount.isConnecting ||
    evmWalletAccount.isReconnecting ||
    solanaWallet.connecting ||
    isStellarLoading ||
    tronWallet.isLoading ||
    webAuthnUI.isSigningIn ||
    webAuthnUI.isCreating

  return {
    async signIn(params: {
      id: ChainType
      connector?: Connector
    }): Promise<void> {
      const strategies = {
        [ChainType.Near]: () => nearWallet.connect(),
        [ChainType.EVM]: () =>
          params.connector
            ? handleSignInViaWagmi({ connector: params.connector })
            : undefined,
        [ChainType.Solana]: () => handleSignInViaSolanaSelector(),
        [ChainType.WebAuthn]: () => webAuthnUI.open(),
        [ChainType.Ton]: () => tonConnectModal.open(),
        [ChainType.Stellar]: () => handleSignInViaStellar(),
        [ChainType.Tron]: () => handleSignInViaTron(),
      }

      return strategies[params.id]()
    },

    async signOut(params: { id: ChainType }): Promise<void> {
      try {
        const strategies = {
          [ChainType.Near]: () => nearWallet.disconnect(),
          [ChainType.EVM]: () => handleSignOutViaWagmi(),
          [ChainType.Solana]: () => handleSignOutViaSolanaSelector(),
          [ChainType.WebAuthn]: () => webAuthnActions.signOut(),
          [ChainType.Ton]: () => tonConnectUI.disconnect(),
          [ChainType.Stellar]: () => handleSignOutViaStellar(),
          [ChainType.Tron]: () => handleSignOutViaTron(),
        }

        onSignOut()
        return strategies[params.id]()
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        const originalError = error instanceof Error ? error : undefined
        throw new WalletDisconnectError(params.id, errorMessage, originalError)
      }
    },

    sendTransaction: async (
      params
    ): Promise<string | FinalExecutionOutcome[] | SendTransactionResponse> => {
      const strategies = {
        [ChainType.Near]: async () => {
          if (!nearWallet.accountId) {
            throw new Error("NEAR wallet not connected")
          }
          return await nearWallet.signAndSendTransactions({
            transactions:
              params.tx as SignAndSendTransactionsParams["transactions"],
          })
        },

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

        [ChainType.WebAuthn]: async () => {
          throw new Error("WebAuthn does not support transactions")
        },

        [ChainType.Ton]: async () => {
          if (!tonWallet) {
            throw new Error("TON wallet not connected")
          }
          const transaction =
            params.tx as SendTransactionTonParams["transactions"]

          const response = await tonConnectUI.sendTransaction(transaction)
          const cell = Cell.fromBoc(Buffer.from(response.boc, "base64"))[0]
          const hash = cell.hash().toString("hex")
          return hash
        },

        [ChainType.Stellar]: async () => {
          if (!publicKey) {
            throw new Error("Stellar wallet not connected")
          }
          const stellarParams = params.tx as SendTransactionStellarParams
          const xdrString = stellarParams.transaction.toXDR()
          const { signedTxXdr } = await signTransactionStellar(xdrString)
          const txHash = await submitTransactionStellar(signedTxXdr)
          return txHash
        },

        [ChainType.Tron]: async () => {
          if (!tronWallet) {
            throw new Error("Tron wallet not connected")
          }
          const tronParams = params.tx as SendTransactionTronParams
          const txHash = await tronWallet.sendTransaction({
            transaction: tronParams,
          })
          return txHash
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
    isLoading,
  }
}

/**
 * Allows getting the impersonation user from the URL.
 * This is used for testing purposes only.
 * example: "/account?user=evm:0xdeadbeef" will return { method: "evm", identifier: "0xdeadbeef" }
 */
function useImpersonatedUser() {
  const searchParams = useSearchParams()
  const user = searchParams.get("user")
  if (user == null) return null
  const index = user.indexOf(":")
  return {
    chainType: user.slice(0, index) as ChainType,
    address: user.slice(index + 1),
    isVerified: true,
    isFake: true,
  }
}

class WalletDisconnectError extends BaseError {
  chainType: ChainType
  originalError?: Error

  constructor(chainType: ChainType, message: string, originalError?: Error) {
    super("Wallet sign out error", {
      cause: originalError,
      metaMessages: [`Chain type: ${chainType}`, `Message: ${message}`],
      name: "WalletDisconnectError",
    })
    this.chainType = chainType
    this.originalError = originalError
  }
}
