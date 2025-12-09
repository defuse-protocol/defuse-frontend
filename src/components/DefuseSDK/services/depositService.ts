import { BlockchainEnum, poaBridge } from "@defuse-protocol/internal-utils"
import { AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token"
import {
  Connection,
  PublicKey as PublicKeySolana,
  SystemProgram,
  Transaction as TransactionSolana,
} from "@solana/web3.js"
import { auroraErc20ABI } from "@src/components/DefuseSDK/utils/blockchain"
import { logger } from "@src/utils/logger"
import {
  type Account,
  Asset,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk"
import { TronWeb } from "tronweb"
import {
  http,
  type Address,
  type Hash,
  createPublicClient,
  encodeFunctionData,
  erc20Abi,
  getAddress,
} from "viem"
import { type ActorRefFrom, waitFor } from "xstate"
import { config } from "../config"
import { settings } from "../constants/settings"
import type { depositEstimationMachine } from "../features/machines/depositEstimationActor"
import type { State as DepositFormContext } from "../features/machines/depositFormReducer"
import type { depositGenerateAddressMachine } from "../features/machines/depositGenerateAddressMachine"
import type { depositTokenBalanceMachine } from "../features/machines/depositTokenBalanceMachine"
import { getNearTxSuccessValue } from "../features/machines/getTxMachine"
import type { storageDepositAmountMachine } from "../features/machines/storageDepositAmountMachine"
import type { SupportedChainName, TokenDeployment } from "../types/base"
import type {
  SendTransactionEVMParams,
  SendTransactionStellarParams,
  SendTransactionTronParams,
  Transaction,
} from "../types/deposit"
import type { SendTransactionTonParams } from "../types/deposit"
import type { IntentsUserId } from "../types/intentsUserId"
import { assert } from "../utils/assert"
import { getEVMChainId } from "../utils/evmChainId"
import { formatTokenValue } from "../utils/format"
import { isNativeToken } from "../utils/token"
import { createTonClient } from "./tonJettonService"
import {
  checkTonJettonWalletRequired,
  createTransferMessage,
  getUserJettonWalletAddress,
} from "./tonJettonService"

export type PreparedDepositReturnType = {
  generateDepositAddress: string | null
  storageDepositAmount: bigint | null
  balance: bigint | null
  /**
   * Near balance is required for depositing wrap.near only. We treat it as a just NEAR token
   * to simplify the user experience by abstracting away the complexity of wrapping and unwrapping
   * base tokens. This approach provides a more streamlined deposit process where users don't need
   * to manually handle token wrapping operations.
   */
  nearBalance: bigint | null
  maxDepositValue: bigint | null
  solanaATACreationRequired: boolean
  tonJettonWalletCreationRequired: boolean
  memo: string | null
}

export type PreparedDepositErrorType = {
  reason:
    | "ERR_PREPARING_DEPOSIT"
    | "ERR_GENERATING_ADDRESS"
    | "ERR_NEP141_STORAGE_CANNOT_FETCH"
    | "ERR_FETCH_BALANCE"
    | "ERR_ESTIMATE_MAX_DEPOSIT_VALUE"
}

export type PreparationOutput =
  | { tag: "ok"; value: PreparedDepositReturnType }
  | { tag: "err"; value: PreparedDepositErrorType }

export async function prepareDeposit(
  {
    userAddress,
    formValues,
    depositGenerateAddressRef,
    storageDepositAmountRef,
    depositTokenBalanceRef,
    depositEstimationRef,
  }: {
    userAddress: string
    formValues: DepositFormContext
    depositGenerateAddressRef: ActorRefFrom<
      typeof depositGenerateAddressMachine
    >
    storageDepositAmountRef: ActorRefFrom<typeof storageDepositAmountMachine>
    depositTokenBalanceRef: ActorRefFrom<typeof depositTokenBalanceMachine>
    depositEstimationRef: ActorRefFrom<typeof depositEstimationMachine>
  },
  { signal }: { signal: AbortSignal }
): Promise<PreparationOutput> {
  assert(formValues.tokenDeployment, "Token is required")

  const userChainType =
    depositGenerateAddressRef.getSnapshot().context.userChainType
  let storageDepositAmount: bigint | null = null
  // Getting storage deposit amount makes sense only for user NEAR wallet
  if (userChainType === AuthMethod.Near) {
    const storageDepositAmountResult = await getStorageDepositAmount(
      {
        storageDepositAmountRef,
      },
      { signal }
    )
    if (storageDepositAmountResult.tag === "err") {
      return storageDepositAmountResult
    }
    storageDepositAmount = storageDepositAmountResult.value.maxDepositValue
  }

  const generateDepositAddress = await getGeneratedDepositAddress(
    {
      depositGenerateAddressRef,
    },
    { signal }
  )
  if (generateDepositAddress.tag === "err") {
    return generateDepositAddress
  }

  const balances = await getBalances(
    {
      depositTokenBalanceRef,
    },
    { signal }
  )
  if (balances.tag === "err") {
    return balances
  }

  const estimation = await getDepositEstimation(
    {
      formValues,
      userAddress,
      balance: balances.value.balance,
      nearBalance: balances.value.nearBalance,
      generateDepositAddress:
        generateDepositAddress.value.generateDepositAddress,
      depositEstimationRef,
    },
    { signal }
  )
  if (estimation.tag === "err") {
    return estimation
  }

  const solanaATACreationRequired = await checkSolanaATARequired(
    formValues.tokenDeployment,
    generateDepositAddress.value.generateDepositAddress
  )

  const tonJettonWalletCreationRequired = await checkTonJettonWalletRequired(
    createTonClient(settings.rpcUrls.ton),
    formValues.tokenDeployment,
    userAddress
  )

  return {
    tag: "ok",
    value: {
      generateDepositAddress:
        generateDepositAddress.value.generateDepositAddress,
      storageDepositAmount,
      balance: balances.value.balance,
      nearBalance: balances.value.nearBalance,
      maxDepositValue: estimation.value.maxDepositValue,
      solanaATACreationRequired,
      tonJettonWalletCreationRequired,
      memo: generateDepositAddress.value.memo,
    },
  }
}

async function getStorageDepositAmount(
  {
    storageDepositAmountRef,
  }: {
    storageDepositAmountRef: ActorRefFrom<typeof storageDepositAmountMachine>
  },
  { signal }: { signal: AbortSignal }
): Promise<
  | { tag: "ok"; value: { maxDepositValue: bigint | null } }
  | { tag: "err"; value: { reason: "ERR_NEP141_STORAGE_CANNOT_FETCH" } }
> {
  const storageDepositAmount = await waitFor(
    storageDepositAmountRef,
    (state) => state.matches("completed"),
    { signal }
  )
  if (storageDepositAmount.context.preparationOutput?.tag === "err") {
    return storageDepositAmount.context.preparationOutput
  }
  return {
    tag: "ok",
    value: {
      maxDepositValue:
        storageDepositAmount.context.preparationOutput?.value ?? null,
    },
  }
}

async function getBalances(
  {
    depositTokenBalanceRef,
  }: {
    depositTokenBalanceRef: ActorRefFrom<typeof depositTokenBalanceMachine>
  },
  { signal }: { signal: AbortSignal }
): Promise<
  | {
      tag: "ok"
      value: {
        balance: bigint
        nearBalance: bigint | null
      }
    }
  | { tag: "err"; value: { reason: "ERR_FETCH_BALANCE" } }
> {
  const depositTokenBalanceState = await waitFor(
    depositTokenBalanceRef,
    (state) => state.matches("completed"),
    { signal }
  )
  const balanceOutput = depositTokenBalanceState.context.preparationOutput
  if (balanceOutput?.tag === "err") {
    return balanceOutput
  }

  const balance = balanceOutput?.value.balance ?? null
  if (balance === null) {
    return { tag: "err", value: { reason: "ERR_FETCH_BALANCE" } }
  }
  return {
    tag: "ok",
    value: {
      balance,
      nearBalance: balanceOutput?.value.nearBalance ?? null,
    },
  }
}

async function getGeneratedDepositAddress(
  {
    depositGenerateAddressRef,
  }: {
    depositGenerateAddressRef: ActorRefFrom<
      typeof depositGenerateAddressMachine
    >
  },
  { signal }: { signal: AbortSignal }
): Promise<
  | {
      tag: "ok"
      value: { generateDepositAddress: string | null; memo: string | null }
    }
  | { tag: "err"; value: { reason: "ERR_GENERATING_ADDRESS" } }
> {
  const depositGenerateAddressState = await waitFor(
    depositGenerateAddressRef,
    (state) => state.matches("completed"),
    { signal }
  )
  const generateDepositAddressOutput =
    depositGenerateAddressState.context.preparationOutput
  if (generateDepositAddressOutput?.tag === "err") {
    return generateDepositAddressOutput
  }
  const generateDepositAddress =
    generateDepositAddressOutput?.value.generateDepositAddress ?? null
  return {
    tag: "ok",
    value: {
      generateDepositAddress,
      memo: generateDepositAddressOutput?.value.memo ?? null,
    },
  }
}

async function getDepositEstimation(
  {
    userAddress,
    formValues,
    balance,
    nearBalance,
    generateDepositAddress,
    depositEstimationRef,
  }: {
    userAddress: string
    formValues: DepositFormContext
    balance: bigint
    nearBalance: bigint | null
    generateDepositAddress: string | null
    depositEstimationRef: ActorRefFrom<typeof depositEstimationMachine>
  },
  { signal }: { signal: AbortSignal }
): Promise<
  | { tag: "ok"; value: { maxDepositValue: bigint | null } }
  | { tag: "err"; value: { reason: "ERR_ESTIMATE_MAX_DEPOSIT_VALUE" } }
> {
  assert(formValues.tokenDeployment, "Token is required")
  assert(formValues.blockchain, "Blockchain is required")
  depositEstimationRef.send({
    type: "REQUEST_ESTIMATE_MAX_DEPOSIT_VALUE",
    params: {
      blockchain: formValues.blockchain,
      userAddress,
      balance: balance,
      nearBalance: nearBalance,
      token: formValues.tokenDeployment,
      generateAddress: generateDepositAddress,
    },
  })
  const depositEstimationState = await waitFor(
    depositEstimationRef,
    (state) => state.matches("completed"),
    { signal }
  )
  if (depositEstimationState.context.preparationOutput?.tag === "err") {
    return depositEstimationState.context.preparationOutput
  }
  return {
    tag: "ok",
    value: {
      maxDepositValue:
        depositEstimationState.context.preparationOutput?.value
          .maxDepositValue ?? null,
    },
  }
}

const FT_DEPOSIT_GAS = `30${"0".repeat(12)}` // 30 TGAS
const FT_TRANSFER_GAS = `50${"0".repeat(12)}` // 30 TGAS

/**
 * Creates a deposit transaction for NEAR.
 *
 * @param receiverId - The address of the Defuse protocol.
 * @param assetId - The address of the asset being deposited.
 * @param amount - The amount to deposit.
 * @returns An array containing the transaction object.
 *
 * @remarks
 * The `args` object in the returned transaction can be customized:
 * - If `msg` is empty, the asset will be deposited to the caller's address.
 * - To create an intent after deposit, `msg` should be a JSON string with the following structure:
 *   {
 *     "receiver_id": "receiver.near", // required
 *     "execute_intents": [...], // signed intents, optional
 *     "refund_if_failed": true // optional, default: false
 *   }
 */
export function createBatchDepositNearNep141Transaction(
  assetAccountId: string,
  amount: bigint,
  storageDepositPayment: bigint
): Transaction["NEAR"][] {
  const actions: Transaction["NEAR"]["actions"] = []

  if (storageDepositPayment > 0n) {
    actions.push({
      type: "FunctionCall" as const,
      params: {
        methodName: "storage_deposit",
        args: {
          account_id: config.env.contractID,
          registration_only: true,
        },
        gas: FT_DEPOSIT_GAS,
        deposit: storageDepositPayment.toString(),
      },
    })
  }

  actions.push({
    type: "FunctionCall",
    params: {
      methodName: "ft_transfer_call",
      args: {
        receiver_id: config.env.contractID,
        amount: amount.toString(),
        msg: "",
      },
      gas: FT_TRANSFER_GAS,
      deposit: "1",
    },
  })

  return [
    {
      receiverId: assetAccountId,
      actions,
    },
  ]
}

export function createBatchDepositNearNativeTransaction(
  amount: bigint,
  nearAmountToWrap: bigint,
  storagePayment: bigint
): Transaction["NEAR"][] {
  const actions: Transaction["NEAR"]["actions"] = []

  if (nearAmountToWrap > 0n || storagePayment > 0n) {
    actions.push({
      type: "FunctionCall" as const,
      params: {
        methodName: "near_deposit",
        args: {},
        gas: FT_DEPOSIT_GAS,
        deposit: (nearAmountToWrap + storagePayment).toString(),
      },
    })
  }

  actions.push({
    type: "FunctionCall",
    params: {
      methodName: "ft_transfer_call",
      args: {
        receiver_id: config.env.contractID,
        amount: amount.toString(),
        msg: "",
      },
      gas: FT_TRANSFER_GAS,
      deposit: "1",
    },
  })
  return [
    {
      receiverId: "wrap.near",
      actions,
    },
  ]
}

export function createDepositVirtualChainERC20Transaction(
  userAddress: string,
  assetAccountId: string,
  generatedAddress: string,
  amount: bigint,
  chainId: number
): SendTransactionEVMParams {
  const data = encodeFunctionData({
    abi: auroraErc20ABI,
    functionName: "withdrawToNear",
    args: [`0x${Buffer.from(generatedAddress).toString("hex")}`, amount],
  })
  return {
    from: getAddress(userAddress),
    to: getAddress(assetAccountId),
    data,
    chainId,
  }
}

export function createDepositEVMERC20Transaction(
  userAddress: string,
  assetAccountId: string,
  generatedAddress: string,
  amount: bigint,
  chainId: number
): SendTransactionEVMParams {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [generatedAddress as Address, amount],
  })
  return {
    from: getAddress(userAddress),
    to: getAddress(assetAccountId),
    data,
    chainId,
  }
}

export function createDepositFromSiloTransaction(
  tokenAddress: string,
  userAddress: string,
  amount: bigint,
  depositAddress: string,
  siloAddress: string,
  value: bigint,
  chainId: number
): SendTransactionEVMParams {
  const data = encodeFunctionData({
    abi: siloToSiloABI,
    functionName: "safeFtTransferCallToNear",
    args: [
      getAddress(tokenAddress),
      amount,
      depositAddress,
      authIdentity.authHandleToIntentsUserId(userAddress, AuthMethod.EVM),
    ],
  })
  const tx: SendTransactionEVMParams = {
    from: getAddress(userAddress),
    to: getAddress(siloAddress),
    data,
    value,
    chainId,
  }

  const virtualChainIds = [
    getEVMChainId("turbochain"),
    getEVMChainId("tuxappchain"),
    getEVMChainId("vertex"),
    getEVMChainId("optima"),
    getEVMChainId("easychain"),
    getEVMChainId("hako"),
    getEVMChainId("aurora_devnet"),
  ]

  if (virtualChainIds.includes(chainId)) {
    // Fake gas price for EVM wallets as relayer doesn't take fee for relaying
    // a transaction to siloToSilo contract.
    tx.gas = 2_300_000n
    tx.gasPrice = 1n
  }

  return tx
}

export function createExitToNearPrecompileTransaction(
  from: string,
  amount: bigint,
  depositAddress: string,
  chainId: number
): SendTransactionEVMParams {
  const etherExitToNearPrecompile = "0xe9217bc70b7ed1f598ddd3199e80b093fa71124f"
  const exitToNearData = `0x00${Buffer.from(depositAddress).toString("hex")}`

  return {
    from: getAddress(from),
    to: etherExitToNearPrecompile,
    value: amount,
    data: exitToNearData as `0x${string}`,
    gas: 121000n,
    chainId,
  }
}

export function createDepositEVMNativeTransaction(
  userAddress: string,
  generatedAddress: string,
  amount: bigint,
  chainId: number
): SendTransactionEVMParams {
  return {
    from: getAddress(userAddress),
    to: getAddress(generatedAddress),
    value: amount,
    data: "0x",
    chainId,
  }
}

export function createDepositSolanaTransaction({
  userAddress,
  depositAddress,
  amount,
  token,
  ataExists,
}: {
  userAddress: string
  depositAddress: string
  amount: bigint
  token: TokenDeployment
  ataExists: boolean
}): TransactionSolana {
  assert(token.chainName === "solana", "Token must be a Solana token")

  if (isNativeToken(token)) {
    return createTransferSolanaTransaction(userAddress, depositAddress, amount)
  }

  return createSPLTransferSolanaTransaction(
    userAddress,
    depositAddress,
    amount,
    token.address,
    ataExists
  )
}

function createTransferSolanaTransaction(
  from: string,
  to: string,
  amount: bigint
): TransactionSolana {
  const transaction = new TransactionSolana().add(
    SystemProgram.transfer({
      fromPubkey: new PublicKeySolana(from),
      toPubkey: new PublicKeySolana(to),
      lamports: amount,
    })
  )
  return transaction
}

function createSPLTransferSolanaTransaction(
  from: string,
  to: string,
  amount: bigint,
  token: string,
  ataExists: boolean
): TransactionSolana {
  const fromPubkey = new PublicKeySolana(from)
  const toPubkey = new PublicKeySolana(to)
  const mintPubkey = new PublicKeySolana(token)

  // Get associated token accounts for sender and receiver
  const fromATA = getAssociatedTokenAddressSync(mintPubkey, fromPubkey)
  const toATA = getAssociatedTokenAddressSync(mintPubkey, toPubkey)

  const transaction = new TransactionSolana()

  if (!ataExists) {
    // Add ATA creation - even if it exists, this will fail gracefully
    transaction.add(
      createAssociatedTokenAccountInstruction(
        fromPubkey,
        toATA,
        toPubkey,
        mintPubkey
      )
    )
  }

  // Add transfer instruction
  transaction.add(createTransferInstruction(fromATA, toATA, fromPubkey, amount))

  return transaction
}

/**
 * Creates a deposit transaction for Stellar
 */
export async function createDepositStellarTransaction({
  userAddress,
  depositAddress,
  amount,
  token,
  memo,
}: {
  userAddress: string
  depositAddress: string
  amount: bigint
  token: TokenDeployment
  memo?: string | null
}): Promise<SendTransactionStellarParams> {
  assert(token.chainName === "stellar", "Token must be a Stellar token")

  const server = new Horizon.Server(getWalletRpcUrl(BlockchainEnum.STELLAR))
  const account = await server.loadAccount(userAddress)
  const amountToFormat = formatTokenValue(amount, token.decimals)

  if (isNativeToken(token)) {
    return createTransferLumenTransaction(
      account,
      depositAddress,
      amountToFormat,
      memo
    )
  }

  assert(token.stellarCode != null, "Token must have a stellar code")

  return createTrustlineTransferStellarTransaction(
    account,
    depositAddress,
    amountToFormat,
    token.address,
    token.stellarCode,
    memo
  )
}

function createTransferLumenTransaction(
  account: Account,
  to: string,
  amount: string,
  memo?: string | null
): SendTransactionStellarParams {
  const transaction = new TransactionBuilder(account, {
    fee: "100", // TODO: Should be checked
    networkPassphrase: Networks.PUBLIC,
  })
    .addOperation(
      Operation.payment({
        destination: to,
        asset: Asset.native(),
        amount: amount,
      })
    )
    .setTimeout(30)

  if (memo) {
    transaction.addMemo(Memo.text(memo))
  }

  return { transaction: transaction.build() }
}

function createTrustlineTransferStellarTransaction(
  account: Account,
  to: string,
  amount: string,
  tokenAddress: string,
  tokenSymbol: string,
  memo?: string | null
): SendTransactionStellarParams {
  const asset = new Asset(tokenSymbol, tokenAddress)
  const transaction = new TransactionBuilder(account, {
    fee: "100", // TODO: Should be checked
    networkPassphrase: Networks.PUBLIC,
  })

  transaction.addOperation(
    Operation.payment({
      destination: to,
      asset: asset,
      amount: amount,
    })
  )

  if (memo) {
    transaction.addMemo(Memo.text(memo))
  }

  return { transaction: transaction.setTimeout(30).build() }
}

/**
 * Creates a deposit transaction for Tron
 */
export async function createDepositTronNativeTransaction(
  userAddress: string,
  depositAddress: string,
  amount: bigint
): Promise<SendTransactionTronParams> {
  const client = new TronWeb({ fullHost: settings.rpcUrls.tron })
  return await client.transactionBuilder.sendTrx(
    depositAddress,
    Number(amount),
    userAddress
  )
}

export async function createDepositTronTRC20Transaction(
  userAddress: string,
  assetAccountId: string,
  generatedAddress: string,
  amount: bigint
): Promise<SendTransactionTronParams> {
  const client = new TronWeb({ fullHost: settings.rpcUrls.tron })
  const txResult = await client.transactionBuilder.triggerSmartContract(
    assetAccountId,
    "transfer(address,uint256)",
    {}, // It might be enhanced in the future with feeLimit
    [
      { type: "address", value: generatedAddress },
      { type: "uint256", value: amount.toString() },
    ],
    userAddress
  )
  if (!txResult?.result) {
    throw new Error("Failed to create deposit Tron TRC20 transaction")
  }
  return txResult.transaction
}

/**
 * Generate a deposit address for the specified blockchain and asset through the POA bridge API call.
 *
 * @param userAddress - The user address from the wallet
 * @param chain - The blockchain for which to generate the address
 * @returns A Promise that resolves to the generated deposit address
 */
export async function generateDepositAddress(
  userAddress: IntentsUserId,
  chain: BlockchainEnum
): Promise<{
  generatedDepositAddress: string
  memo: string | null
}> {
  const supportedTokens = await poaBridge.httpClient.getSupportedTokens({
    chains: [chain],
  })

  if (supportedTokens.tokens.length === 0) {
    throw new Error("No supported tokens found")
  }

  const depositNetworkMemo = getDepositNetworkMemo(chain)
  const generatedDepositAddress = await poaBridge.httpClient.getDepositAddress({
    account_id: userAddress,
    chain,
    ...(depositNetworkMemo && depositNetworkMemo),
  })

  return {
    generatedDepositAddress: generatedDepositAddress.address,
    memo: generatedDepositAddress.memo ?? null,
  }
}

export async function checkNearTransactionValidity(
  txHash: string,
  accountId: string,
  amount: string
): Promise<boolean> {
  if (!txHash) {
    throw new Error("Transaction hash is required")
  }
  const successValue = await getNearTxSuccessValue({
    txHash,
    senderAccountId: accountId,
  })
  // Check if input amount is equal to the success value
  return successValue === BigInt(amount)
}

export async function getAllowance(
  tokenAddress: string,
  owner: string,
  spender: string,
  network: BlockchainEnum
): Promise<bigint | null> {
  const client = createPublicClient({
    transport: http(getWalletRpcUrl(network)),
  })
  const result = await client.readContract({
    address: getAddress(tokenAddress),
    abi: erc20Abi,
    functionName: "allowance",
    args: [getAddress(owner), getAddress(spender)],
  })
  return result
}

export function createApproveTransaction(
  tokenAddress: string,
  spender: string,
  amount: bigint,
  from: string,
  chainId: number
): SendTransactionEVMParams {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [getAddress(spender), amount],
  })
  return {
    to: getAddress(tokenAddress),
    data,
    from: getAddress(from),
    chainId,
  }
}

export function waitEVMTransaction({
  chainName,
  txHash,
}: {
  chainName: SupportedChainName
  txHash: Hash
}) {
  const client = createPublicClient({
    transport: http(settings.rpcUrls[chainName]),
  })
  return client.waitForTransactionReceipt({ hash: txHash })
}

/**
 * Get the available deposit routes for a given wallet connection and selected network.
 *
 * @param chainTypeFromWallet - The type of chain from wallet connection [near, evm].
 * @param network - The network to check.
 * @returns An object containing the available deposit routes.
 *
 * @remarks
 * - `activeDeposit` is deposit via wallet extension.
 * - `passiveDeposit` is deposit via generated address at QR code provided by POA bridge.
 */
export function getAvailableDepositRoutes(
  chainTypeFromWallet: AuthMethod,
  network: BlockchainEnum
): { activeDeposit: boolean; passiveDeposit: boolean } | null {
  switch (chainTypeFromWallet) {
    case AuthMethod.Near:
      switch (network) {
        /* allowed all */
        case BlockchainEnum.NEAR:
          return {
            activeDeposit: true,
            passiveDeposit: true,
          }

        /* allowed passive */
        case BlockchainEnum.ETHEREUM:
        case BlockchainEnum.BASE:
        case BlockchainEnum.ARBITRUM:
        case BlockchainEnum.BITCOIN:
        case BlockchainEnum.BITCOINCASH:
        case BlockchainEnum.SOLANA:
        case BlockchainEnum.DOGECOIN:
        case BlockchainEnum.XRPLEDGER:
        case BlockchainEnum.ZCASH:
        case BlockchainEnum.GNOSIS:
        case BlockchainEnum.BERACHAIN:
        case BlockchainEnum.TRON:
        case BlockchainEnum.POLYGON:
        case BlockchainEnum.BSC:
        case BlockchainEnum.TON:
        case BlockchainEnum.OPTIMISM:
        case BlockchainEnum.AVALANCHE:
        case BlockchainEnum.SUI:
        case BlockchainEnum.STELLAR:
        case BlockchainEnum.APTOS:
        case BlockchainEnum.CARDANO:
        case BlockchainEnum.LITECOIN:
        case BlockchainEnum.MONAD:
        case BlockchainEnum.LAYERX:
        case BlockchainEnum.ADI:
          return {
            activeDeposit: false,
            passiveDeposit: true,
          }

        /* not-allowed all */
        case BlockchainEnum.TURBOCHAIN:
        case BlockchainEnum.TUXAPPCHAIN:
        case BlockchainEnum.VERTEX:
        case BlockchainEnum.OPTIMA:
        case BlockchainEnum.EASYCHAIN:
        case BlockchainEnum.HAKO:
        case BlockchainEnum.AURORA:
        case BlockchainEnum.AURORA_DEVNET:
        case BlockchainEnum.HYPERLIQUID:
        case BlockchainEnum.STARKNET:
          return {
            activeDeposit: false,
            passiveDeposit: false,
          }
        default:
          network satisfies never
          throw new Error("exhaustive check failed")
      }
    case AuthMethod.EVM:
      switch (network) {
        /* allowed all */
        case BlockchainEnum.ETHEREUM:
        case BlockchainEnum.BASE:
        case BlockchainEnum.ARBITRUM:
        case BlockchainEnum.GNOSIS:
        case BlockchainEnum.BERACHAIN:
        case BlockchainEnum.POLYGON:
        case BlockchainEnum.BSC:
        case BlockchainEnum.OPTIMISM:
        case BlockchainEnum.AVALANCHE:
        case BlockchainEnum.MONAD:
        case BlockchainEnum.LAYERX:
        case BlockchainEnum.ADI:
          return {
            activeDeposit: true,
            passiveDeposit: true,
          }

        /* allowed passive */
        case BlockchainEnum.NEAR:
        case BlockchainEnum.BITCOIN:
        case BlockchainEnum.BITCOINCASH:
        case BlockchainEnum.SOLANA:
        case BlockchainEnum.DOGECOIN:
        case BlockchainEnum.XRPLEDGER:
        case BlockchainEnum.ZCASH:
        case BlockchainEnum.TRON:
        case BlockchainEnum.TON:
        case BlockchainEnum.SUI:
        case BlockchainEnum.STELLAR:
        case BlockchainEnum.APTOS:
        case BlockchainEnum.CARDANO:
        case BlockchainEnum.LITECOIN:
          return {
            activeDeposit: false,
            passiveDeposit: true,
          }

        /* allowed active */
        case BlockchainEnum.TURBOCHAIN:
        case BlockchainEnum.TUXAPPCHAIN:
        case BlockchainEnum.VERTEX:
        case BlockchainEnum.OPTIMA:
        case BlockchainEnum.EASYCHAIN:
        case BlockchainEnum.HAKO:
        case BlockchainEnum.AURORA:
        case BlockchainEnum.AURORA_DEVNET:
          return {
            activeDeposit: true,
            passiveDeposit: false,
          }

        /* not-allowed all */
        case BlockchainEnum.HYPERLIQUID:
        case BlockchainEnum.STARKNET:
          return {
            activeDeposit: false,
            passiveDeposit: false,
          }
        default:
          network satisfies never
          throw new Error("exhaustive check failed")
      }
    case AuthMethod.Solana:
      switch (network) {
        /* allowed all */
        case BlockchainEnum.SOLANA:
          return {
            activeDeposit: true,
            passiveDeposit: true,
          }

        /* allowed passive */
        case BlockchainEnum.ETHEREUM:
        case BlockchainEnum.BASE:
        case BlockchainEnum.ARBITRUM:
        case BlockchainEnum.BITCOIN:
        case BlockchainEnum.BITCOINCASH:
        case BlockchainEnum.DOGECOIN:
        case BlockchainEnum.XRPLEDGER:
        case BlockchainEnum.ZCASH:
        case BlockchainEnum.GNOSIS:
        case BlockchainEnum.BERACHAIN:
        case BlockchainEnum.TRON:
        case BlockchainEnum.POLYGON:
        case BlockchainEnum.BSC:
        case BlockchainEnum.NEAR:
        case BlockchainEnum.TON:
        case BlockchainEnum.OPTIMISM:
        case BlockchainEnum.AVALANCHE:
        case BlockchainEnum.SUI:
        case BlockchainEnum.STELLAR:
        case BlockchainEnum.APTOS:
        case BlockchainEnum.CARDANO:
        case BlockchainEnum.LITECOIN:
        case BlockchainEnum.MONAD:
        case BlockchainEnum.LAYERX:
        case BlockchainEnum.ADI:
          return {
            activeDeposit: false,
            passiveDeposit: true,
          }

        /* not-allowed all */
        case BlockchainEnum.TURBOCHAIN:
        case BlockchainEnum.TUXAPPCHAIN:
        case BlockchainEnum.VERTEX:
        case BlockchainEnum.OPTIMA:
        case BlockchainEnum.EASYCHAIN:
        case BlockchainEnum.HAKO:
        case BlockchainEnum.AURORA:
        case BlockchainEnum.AURORA_DEVNET:
        case BlockchainEnum.HYPERLIQUID:
        case BlockchainEnum.STARKNET:
          return {
            activeDeposit: false,
            passiveDeposit: false,
          }
        default:
          network satisfies never
          throw new Error("exhaustive check failed")
      }
    case AuthMethod.WebAuthn:
      switch (network) {
        /* allowed passive */
        case BlockchainEnum.ETHEREUM:
        case BlockchainEnum.BASE:
        case BlockchainEnum.ARBITRUM:
        case BlockchainEnum.BITCOIN:
        case BlockchainEnum.BITCOINCASH:
        case BlockchainEnum.DOGECOIN:
        case BlockchainEnum.XRPLEDGER:
        case BlockchainEnum.ZCASH:
        case BlockchainEnum.GNOSIS:
        case BlockchainEnum.BERACHAIN:
        case BlockchainEnum.SOLANA:
        case BlockchainEnum.TRON:
        case BlockchainEnum.POLYGON:
        case BlockchainEnum.BSC:
        case BlockchainEnum.NEAR:
        case BlockchainEnum.TON:
        case BlockchainEnum.OPTIMISM:
        case BlockchainEnum.AVALANCHE:
        case BlockchainEnum.SUI:
        case BlockchainEnum.STELLAR:
        case BlockchainEnum.APTOS:
        case BlockchainEnum.CARDANO:
        case BlockchainEnum.LITECOIN:
        case BlockchainEnum.MONAD:
        case BlockchainEnum.LAYERX:
        case BlockchainEnum.ADI:
          return {
            activeDeposit: false,
            passiveDeposit: true,
          }

        /* not-allowed all */
        case BlockchainEnum.TURBOCHAIN:
        case BlockchainEnum.TUXAPPCHAIN:
        case BlockchainEnum.VERTEX:
        case BlockchainEnum.OPTIMA:
        case BlockchainEnum.EASYCHAIN:
        case BlockchainEnum.HAKO:
        case BlockchainEnum.AURORA:
        case BlockchainEnum.AURORA_DEVNET:
        case BlockchainEnum.HYPERLIQUID:
        case BlockchainEnum.STARKNET:
          return {
            activeDeposit: false,
            passiveDeposit: false,
          }
        default:
          network satisfies never
          throw new Error("exhaustive check failed")
      }
    case AuthMethod.Ton:
      switch (network) {
        /* allowed all */
        case BlockchainEnum.TON:
          return {
            activeDeposit: true,
            passiveDeposit: true,
          }

        /* allowed passive */
        case BlockchainEnum.ETHEREUM:
        case BlockchainEnum.BASE:
        case BlockchainEnum.ARBITRUM:
        case BlockchainEnum.BITCOIN:
        case BlockchainEnum.BITCOINCASH:
        case BlockchainEnum.DOGECOIN:
        case BlockchainEnum.XRPLEDGER:
        case BlockchainEnum.ZCASH:
        case BlockchainEnum.GNOSIS:
        case BlockchainEnum.BERACHAIN:
        case BlockchainEnum.SOLANA:
        case BlockchainEnum.TRON:
        case BlockchainEnum.POLYGON:
        case BlockchainEnum.BSC:
        case BlockchainEnum.NEAR:
        case BlockchainEnum.OPTIMISM:
        case BlockchainEnum.AVALANCHE:
        case BlockchainEnum.SUI:
        case BlockchainEnum.STELLAR:
        case BlockchainEnum.APTOS:
        case BlockchainEnum.CARDANO:
        case BlockchainEnum.LITECOIN:
        case BlockchainEnum.MONAD:
        case BlockchainEnum.LAYERX:
        case BlockchainEnum.ADI:
          return {
            activeDeposit: false,
            passiveDeposit: true,
          }

        /* not-allowed all */
        case BlockchainEnum.TURBOCHAIN:
        case BlockchainEnum.TUXAPPCHAIN:
        case BlockchainEnum.VERTEX:
        case BlockchainEnum.OPTIMA:
        case BlockchainEnum.EASYCHAIN:
        case BlockchainEnum.HAKO:
        case BlockchainEnum.AURORA:
        case BlockchainEnum.AURORA_DEVNET:
        case BlockchainEnum.HYPERLIQUID:
        case BlockchainEnum.STARKNET:
          return {
            activeDeposit: false,
            passiveDeposit: false,
          }
        default:
          network satisfies never
          throw new Error("exhaustive check failed")
      }
    case AuthMethod.Stellar:
      switch (network) {
        /* allowed all */
        case BlockchainEnum.STELLAR:
          return {
            activeDeposit: true,
            passiveDeposit: true,
          }

        /* allowed passive */
        case BlockchainEnum.ETHEREUM:
        case BlockchainEnum.BASE:
        case BlockchainEnum.ARBITRUM:
        case BlockchainEnum.BITCOIN:
        case BlockchainEnum.BITCOINCASH:
        case BlockchainEnum.DOGECOIN:
        case BlockchainEnum.XRPLEDGER:
        case BlockchainEnum.ZCASH:
        case BlockchainEnum.GNOSIS:
        case BlockchainEnum.BERACHAIN:
        case BlockchainEnum.TRON:
        case BlockchainEnum.POLYGON:
        case BlockchainEnum.BSC:
        case BlockchainEnum.NEAR:
        case BlockchainEnum.TON:
        case BlockchainEnum.OPTIMISM:
        case BlockchainEnum.AVALANCHE:
        case BlockchainEnum.SUI:
        case BlockchainEnum.SOLANA:
        case BlockchainEnum.APTOS:
        case BlockchainEnum.CARDANO:
        case BlockchainEnum.LITECOIN:
        case BlockchainEnum.MONAD:
        case BlockchainEnum.LAYERX:
        case BlockchainEnum.ADI:
          return {
            activeDeposit: false,
            passiveDeposit: true,
          }

        /* not-allowed all */
        case BlockchainEnum.TURBOCHAIN:
        case BlockchainEnum.TUXAPPCHAIN:
        case BlockchainEnum.VERTEX:
        case BlockchainEnum.OPTIMA:
        case BlockchainEnum.EASYCHAIN:
        case BlockchainEnum.HAKO:
        case BlockchainEnum.AURORA:
        case BlockchainEnum.AURORA_DEVNET:
        case BlockchainEnum.HYPERLIQUID:
        case BlockchainEnum.STARKNET:
          return {
            activeDeposit: false,
            passiveDeposit: false,
          }
        default:
          network satisfies never
          throw new Error("exhaustive check failed")
      }
    case AuthMethod.Tron:
      switch (network) {
        /* allowed all */
        case BlockchainEnum.TRON:
          return {
            activeDeposit: true,
            passiveDeposit: true,
          }

        /* allowed passive */
        case BlockchainEnum.ETHEREUM:
        case BlockchainEnum.BASE:
        case BlockchainEnum.ARBITRUM:
        case BlockchainEnum.BITCOIN:
        case BlockchainEnum.BITCOINCASH:
        case BlockchainEnum.DOGECOIN:
        case BlockchainEnum.XRPLEDGER:
        case BlockchainEnum.ZCASH:
        case BlockchainEnum.GNOSIS:
        case BlockchainEnum.BERACHAIN:
        case BlockchainEnum.STELLAR:
        case BlockchainEnum.POLYGON:
        case BlockchainEnum.BSC:
        case BlockchainEnum.NEAR:
        case BlockchainEnum.TON:
        case BlockchainEnum.OPTIMISM:
        case BlockchainEnum.AVALANCHE:
        case BlockchainEnum.SUI:
        case BlockchainEnum.SOLANA:
        case BlockchainEnum.APTOS:
        case BlockchainEnum.CARDANO:
        case BlockchainEnum.LITECOIN:
        case BlockchainEnum.MONAD:
        case BlockchainEnum.LAYERX:
          return {
            activeDeposit: false,
            passiveDeposit: true,
          }

        /* not-allowed all */
        case BlockchainEnum.TURBOCHAIN:
        case BlockchainEnum.TUXAPPCHAIN:
        case BlockchainEnum.VERTEX:
        case BlockchainEnum.OPTIMA:
        case BlockchainEnum.EASYCHAIN:
        case BlockchainEnum.HAKO:
        case BlockchainEnum.AURORA:
        case BlockchainEnum.AURORA_DEVNET:
        case BlockchainEnum.HYPERLIQUID:
        case BlockchainEnum.ADI:
        case BlockchainEnum.STARKNET:
          return {
            activeDeposit: false,
            passiveDeposit: false,
          }
        default:
          network satisfies never
          throw new Error("exhaustive check failed")
      }
    default:
      chainTypeFromWallet satisfies never
      throw new Error("exhaustive check failed")
  }
}

// Use this function to get strong typing for RPC URLs
export function getWalletRpcUrl(network: BlockchainEnum): string {
  switch (network) {
    case BlockchainEnum.NEAR:
      return settings.rpcUrls.near
    case BlockchainEnum.ETHEREUM:
      return settings.rpcUrls.eth
    case BlockchainEnum.BASE:
      return settings.rpcUrls.base
    case BlockchainEnum.ARBITRUM:
      return settings.rpcUrls.arbitrum
    case BlockchainEnum.BITCOIN:
      return settings.rpcUrls.bitcoin
    case BlockchainEnum.BITCOINCASH:
      return settings.rpcUrls.bitcoincash
    case BlockchainEnum.SOLANA:
      return settings.rpcUrls.solana
    case BlockchainEnum.DOGECOIN:
      return settings.rpcUrls.dogecoin
    case BlockchainEnum.TURBOCHAIN:
      return settings.rpcUrls.turbochain
    case BlockchainEnum.AURORA:
      return settings.rpcUrls.aurora
    case BlockchainEnum.AURORA_DEVNET:
      return settings.rpcUrls.aurora_devnet
    case BlockchainEnum.XRPLEDGER:
      return settings.rpcUrls.xrpledger
    case BlockchainEnum.ZCASH:
      return settings.rpcUrls.zcash
    case BlockchainEnum.GNOSIS:
      return settings.rpcUrls.gnosis
    case BlockchainEnum.BERACHAIN:
      return settings.rpcUrls.berachain
    case BlockchainEnum.TRON:
      return settings.rpcUrls.tron
    case BlockchainEnum.TUXAPPCHAIN:
      return settings.rpcUrls.tuxappchain
    case BlockchainEnum.VERTEX:
      return settings.rpcUrls.vertex
    case BlockchainEnum.OPTIMA:
      return settings.rpcUrls.optima
    case BlockchainEnum.EASYCHAIN:
      return settings.rpcUrls.easychain
    case BlockchainEnum.HAKO:
      return settings.rpcUrls.hako
    case BlockchainEnum.POLYGON:
      return settings.rpcUrls.polygon
    case BlockchainEnum.BSC:
      return settings.rpcUrls.bsc
    case BlockchainEnum.HYPERLIQUID:
      return settings.rpcUrls.hyperliquid
    case BlockchainEnum.TON:
      return settings.rpcUrls.ton
    case BlockchainEnum.OPTIMISM:
      return settings.rpcUrls.optimism
    case BlockchainEnum.AVALANCHE:
      return settings.rpcUrls.avalanche
    case BlockchainEnum.SUI:
      return settings.rpcUrls.sui
    case BlockchainEnum.STELLAR:
      return settings.rpcUrls.stellar
    case BlockchainEnum.APTOS:
      return settings.rpcUrls.aptos
    case BlockchainEnum.CARDANO:
      return settings.rpcUrls.cardano
    case BlockchainEnum.LITECOIN:
      return settings.rpcUrls.litecoin
    case BlockchainEnum.LAYERX:
      return settings.rpcUrls.layerx
    case BlockchainEnum.MONAD:
      return settings.rpcUrls.monad
    case BlockchainEnum.ADI:
      return settings.rpcUrls.adi
    case BlockchainEnum.STARKNET:
      return settings.rpcUrls.starknet
    default:
      network satisfies never
      throw new Error("exhaustive check failed")
  }
}

export type DepositNetworkMemo = {
  deposit_mode: "MEMO"
} | null

/**
 * @notes - Stellar is the only blockchain that requires a memo at that moment.
 */
export function getDepositNetworkMemo(
  network: BlockchainEnum
): DepositNetworkMemo {
  switch (network) {
    case BlockchainEnum.STELLAR:
      return {
        deposit_mode: "MEMO",
      }
    default:
      return null
  }
}

const siloToSiloABI = [
  {
    inputs: [
      {
        internalType: "contract IEvmErc20",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint128",
        name: "amount",
        type: "uint128",
      },
      {
        internalType: "string",
        name: "receiverId",
        type: "string",
      },
      {
        internalType: "string",
        name: "message",
        type: "string",
      },
    ],
    name: "safeFtTransferCallToNear",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
]

// Cache for ATA existence checks to prevent RPC spam
// Key format: "token:depositAddress"
const ataExistenceCache = new Map<
  string,
  { exists: boolean; timestamp: number }
>()
const ATA_CACHE_TTL = 60000 // 1 minute TTL

async function checkATAExists(
  connection: Connection,
  ataAddress: PublicKeySolana
): Promise<boolean> {
  try {
    await getAccount(connection, ataAddress)
    return true
  } catch (error) {
    logger.error("Error checking Solana ATA existence", { error })
    return false
  }
}

function clearATACacheForToken(token: TokenDeployment, depositAddress: string) {
  if (token.chainName !== "solana" || isNativeToken(token)) {
    return
  }
  const cacheKey = `${token.address}:${depositAddress}`
  ataExistenceCache.delete(cacheKey)
}

async function checkSolanaATARequired(
  token: TokenDeployment,
  depositAddress: string | null
): Promise<boolean> {
  if (
    token.chainName !== "solana" ||
    isNativeToken(token) ||
    depositAddress === null
  ) {
    return false
  }

  const cacheKey = `${token.address}:${depositAddress}`
  const now = Date.now()

  // Check cache first
  const cached = ataExistenceCache.get(cacheKey)
  if (cached && now - cached.timestamp < ATA_CACHE_TTL) {
    return !cached.exists
  }

  const connection = new Connection(settings.rpcUrls.solana)
  const toPubkey = new PublicKeySolana(depositAddress)
  const mintPubkey = new PublicKeySolana(token.address)
  const toATA = getAssociatedTokenAddressSync(mintPubkey, toPubkey)

  const ataExists = await checkATAExists(connection, toATA)

  // Update cache
  ataExistenceCache.set(cacheKey, {
    exists: ataExists,
    timestamp: now,
  })

  return !ataExists
}

export function clearSolanaATACache(
  token: TokenDeployment,
  depositAddress: string
) {
  clearATACacheForToken(token, depositAddress)
}

export async function createDepositTonTransaction(
  userWalletAddress: string,
  depositAddress: string,
  amount: bigint,
  token: TokenDeployment
): Promise<SendTransactionTonParams> {
  assert(token.chainName === "ton", "Token chain name is not TON")

  if (isNativeToken(token)) {
    return createDepositTonNativeTransaction(depositAddress, amount)
  }

  return await createDepositTonJettonTransaction(
    userWalletAddress,
    depositAddress,
    amount,
    token.address
  )
}

export function createDepositTonNativeTransaction(
  depositAddress: string,
  amount: bigint
): SendTransactionTonParams {
  return {
    validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutes from now
    messages: [
      {
        address: depositAddress,
        amount: amount.toString(),
      },
    ],
  }
}

export async function createDepositTonJettonTransaction(
  userWalletAddress: string,
  depositAddress: string,
  amount: bigint,
  jettonMasterAddress: string
): Promise<SendTransactionTonParams> {
  const userJettonWalletAddress = await getUserJettonWalletAddress(
    createTonClient(settings.rpcUrls.ton),
    userWalletAddress,
    jettonMasterAddress
  )
  const transferMessagePayload = createTransferMessage(
    amount,
    depositAddress,
    userWalletAddress
  )

  return {
    validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutes from now
    messages: [
      {
        address: userJettonWalletAddress,
        amount: "80000000", // 0.08 TON to cover gas fees
        payload: transferMessagePayload,
      },
    ],
  }
}
