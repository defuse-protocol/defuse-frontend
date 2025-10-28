import type { authHandle } from "@defuse-protocol/internal-utils"
import type { Transaction as TransactionSolana } from "@solana/web3.js"
import type { Transaction as TransactionStellar } from "@stellar/stellar-sdk"
import type { Transaction as TransactionTron } from "@tronweb3/tronwallet-abstract-adapter"
import type { Address, Hash } from "viem"
import type { TokenInfo } from "./base"
import type { RenderHostAppLink } from "./hostAppLink"

export type DepositWidgetProps = {
  userAddress: authHandle.AuthHandle["identifier"] | undefined
  chainType: authHandle.AuthHandle["method"] | undefined
  userWalletAddress: string | null
  renderHostAppLink: RenderHostAppLink
  tokenList: TokenInfo[]
  sendTransactionNear: (tx: Transaction["NEAR"][]) => Promise<string | null>
  sendTransactionEVM: (tx: Transaction["EVM"]) => Promise<Hash | null>
  sendTransactionSolana: (tx: Transaction["Solana"]) => Promise<string | null>
  sendTransactionTon: (tx: Transaction["TON"]) => Promise<string | null>
  sendTransactionStellar: (tx: Transaction["Stellar"]) => Promise<string | null>
  sendTransactionTron: (tx: Transaction["Tron"]) => Promise<string | null>
  initialToken?: TokenInfo
  onTokenChange?: (params: {
    token: TokenInfo | null
  }) => void
}

export type Transaction = {
  NEAR: SendTransactionNearParams
  EVM: SendTransactionEVMParams
  Solana: SendTransactionSolanaParams
  TON: SendTransactionTonParams
  Stellar: SendTransactionStellarParams
  Tron: SendTransactionTronParams
}

export type DepositEvent = {
  type: string
  data: unknown
  error?: string
}

export interface FunctionCallAction {
  type: "FunctionCall"
  params: {
    methodName: string
    args: Record<string, unknown>
    gas: string
    deposit: string
  }
}

export type Action = FunctionCallAction

export interface SendTransactionNearParams {
  receiverId: string
  actions: Array<Action>
}

export interface SendTransactionEVMParams {
  from: Address
  to: Address
  chainId: number
  data: Hash
  value?: bigint
  gasPrice?: bigint
  gas?: bigint
}

export interface SendTransactionSolanaParams extends TransactionSolana {}

export interface SendTransactionTonParams {
  validUntil: number
  messages: Array<{
    address: string
    amount: string
    payload?: string
  }>
}

export interface SendTransactionStellarParams {
  transaction: TransactionStellar
}

export interface SendTransactionTronParams extends TransactionTron {}
