import { authIdentity } from "@defuse-protocol/internal-utils"
import { depositMachine } from "@src/components/DefuseSDK/features/machines/depositMachine"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { logger } from "@src/utils/logger"
import { createActorContext } from "@xstate/react"
import type { PropsWithChildren, ReactElement, ReactNode } from "react"
import { useFormContext } from "react-hook-form"
import { type Hash, getAddress } from "viem"
import {
  type Actor,
  type ActorOptions,
  type SnapshotFrom,
  fromPromise,
} from "xstate"
import { siloToSiloAddress } from "../../../constants/aurora"
import {
  checkNearTransactionValidity,
  createApproveTransaction,
  createBatchDepositNearNativeTransaction,
  createBatchDepositNearNep141Transaction,
  createDepositEVMERC20Transaction,
  createDepositEVMNativeTransaction,
  createDepositFromSiloTransaction,
  createDepositSolanaTransaction,
  createDepositStellarTransaction,
  createDepositTonTransaction,
  createDepositTronNativeTransaction,
  createDepositTronTRC20Transaction,
  createDepositVirtualChainERC20Transaction,
  createExitToNearPrecompileTransaction,
  getAllowance,
  waitEVMTransaction,
} from "../../../services/depositService"
import type { Transaction } from "../../../types/deposit"
import { assetNetworkAdapter } from "../../../utils/adapters"
import { assert } from "../../../utils/assert"
import { getEVMChainId } from "../../../utils/evmChainId"
import { isFungibleToken, isNativeToken } from "../../../utils/token"
import { DepositMode } from "../../machines/depositFormReducer"
import { depositGenerateAddressMachine } from "../../machines/depositGenerateAddressMachine"
import { depositUIMachine } from "../../machines/depositUIMachine"
import { useDepositTokenChangeNotifier } from "../../swap/hooks/useTokenChangeNotifier"
import type { DepositFormValues } from "./DepositForm"

/**
 * We explicitly define the type of `depositUIMachine` to avoid:
 * ```
 * See description at @SwapUIMachineProvider.tsx
 * ```
 */
interface DepositUIMachineContextInterface {
  useSelector: <T>(
    selector: (snapshot: SnapshotFrom<typeof depositUIMachine>) => T,
    compare?: (a: T, b: T) => boolean
  ) => T
  useActorRef: () => Actor<typeof depositUIMachine>
  Provider: (props: {
    children: ReactNode
    options?: ActorOptions<typeof depositUIMachine>
    /** @deprecated Use `logic` instead. */
    machine?: never
    logic?: typeof depositUIMachine
    // biome-ignore lint/suspicious/noExplicitAny: it is fine `any` here
  }) => ReactElement<any, any>
}

export const DepositUIMachineContext: DepositUIMachineContextInterface =
  createActorContext(depositUIMachine)

interface DepositUIMachineProviderProps extends PropsWithChildren {
  tokenList: TokenInfo[]
  initialToken?: TokenInfo
  sendTransactionNear: (tx: Transaction["NEAR"][]) => Promise<string | null>
  sendTransactionEVM: (tx: Transaction["EVM"]) => Promise<Hash | null>
  sendTransactionSolana: (tx: Transaction["Solana"]) => Promise<string | null>
  sendTransactionTon: (tx: Transaction["TON"]) => Promise<string | null>
  sendTransactionStellar: (tx: Transaction["Stellar"]) => Promise<string | null>
  sendTransactionTron: (tx: Transaction["Tron"]) => Promise<string | null>
  onTokenChange?: (params: {
    token: TokenInfo | null
  }) => void
}

export function DepositUIMachineProvider({
  children,
  tokenList,
  initialToken,
  sendTransactionNear,
  sendTransactionEVM,
  sendTransactionSolana,
  sendTransactionTon,
  sendTransactionStellar,
  sendTransactionTron,
  onTokenChange,
}: DepositUIMachineProviderProps) {
  const { setValue } = useFormContext<DepositFormValues>()
  const token = initialToken ?? tokenList[0]
  assert(token != null, "Token is not defined")

  const is1cs = useIs1CsEnabled()

  return (
    <DepositUIMachineContext.Provider
      key={is1cs ? "1cs" : "not1cs"}
      options={{
        input: {
          tokenList,
          token,
          is1cs,
        },
      }}
      logic={depositUIMachine.provide({
        actors: {
          depositGenerateAddressActor: depositGenerateAddressMachine.provide({
            actors: {
              generateDepositAddress: fromPromise(async ({ input }) => {
                const {
                  userAddress,
                  blockchain,
                  userChainType,
                  depositMode,
                  tokenIn,
                  tokenOut,
                } = input

                if (depositMode === DepositMode.ONE_CLICK) {
                  const result = await fetch("/api/deposit-address/1click", {
                    method: "POST",
                    body: JSON.stringify({
                      userAddress,
                      userChainType,
                      chainName: blockchain,
                      tokenIn,
                      tokenOut,
                    }),
                  })
                  return await result.json()
                }

                const result = await fetch("/api/deposit-address/poa", {
                  method: "POST",
                  body: JSON.stringify({
                    accountId: authIdentity.authHandleToIntentsUserId(
                      userAddress,
                      userChainType
                    ),
                    blockchain: assetNetworkAdapter[blockchain],
                  }),
                })
                return await result.json()
              }),
            },
          }),
          depositNearActor: depositMachine.provide({
            actors: {
              signAndSendTransactions: fromPromise(async ({ input }) => {
                const {
                  tokenDeployment,
                  balance,
                  amount,
                  nearBalance,
                  storageDepositAmount,
                } = input
                const address = isFungibleToken(tokenDeployment)
                  ? tokenDeployment.address
                  : null

                assert(address != null, "Address is not defined")
                assert(
                  storageDepositAmount !== null,
                  "Storage deposit required is null"
                )
                assert(nearBalance !== null, "Near balance is null")

                let tx: Transaction["NEAR"][] = []
                if (address === "wrap.near") {
                  /**
                   * On calculation of the balance NEAR, we bound it with the amount of wrap.near
                   * So to destinguish how much NEAR we have, we need to subtract the amount of wrap.near
                   *
                   * Example:
                   * amount = 100n
                   * near = 0n
                   * wrap.near = 100n
                   * wNearBalance = 100n - 0n = 100n
                   * nearAmountToWrap = 100n - 100n = 0n
                   */
                  const wNearBalance = balance - nearBalance
                  const nearAmountToWrap = amount - wNearBalance
                  tx = createBatchDepositNearNativeTransaction(
                    amount,
                    nearAmountToWrap > 0n ? nearAmountToWrap : 0n,
                    storageDepositAmount > 0n ? storageDepositAmount : 0n
                  )
                } else {
                  tx = createBatchDepositNearNep141Transaction(
                    address,
                    amount,
                    storageDepositAmount
                  )
                }

                const txHash = await sendTransactionNear(tx)
                assert(txHash != null, "Transaction failed")
                return txHash
              }),
              validateTransaction: fromPromise(async ({ input }) => {
                const { txHash, userAddress, amount } = input
                assert(txHash != null, "Tx hash is not defined")

                const isValid = await checkNearTransactionValidity(
                  txHash,
                  userAddress,
                  amount.toString()
                )
                return isValid
              }),
            },
            guards: {
              isDepositParamsValid: ({ context }) => {
                return (
                  context.storageDepositAmount !== null &&
                  context.nearBalance !== null
                )
              },
            },
          }),
          depositEVMActor: depositMachine.provide({
            actors: {
              signAndSendTransactions: fromPromise(async ({ input }) => {
                const {
                  tokenDeployment,
                  amount,
                  depositAddress,
                  userAddress,
                  chainName,
                } = input
                const chainId = getEVMChainId(chainName)

                assert(depositAddress != null, "Deposit address is not defined")

                let tx: Transaction["EVM"]
                if (isNativeToken(tokenDeployment)) {
                  tx = createDepositEVMNativeTransaction(
                    userAddress,
                    depositAddress,
                    amount,
                    chainId
                  )
                } else {
                  tx = createDepositEVMERC20Transaction(
                    userAddress,
                    tokenDeployment.address,
                    depositAddress,
                    amount,
                    chainId
                  )
                }

                logger.trace("Sending transfer EVM transaction")
                const txHash = await sendTransactionEVM(tx)
                assert(txHash != null, "Tx hash is not defined")

                logger.trace("Waiting for transfer EVM transaction", {
                  txHash,
                })
                const receipt = await waitEVMTransaction({ txHash, chainName })
                if (receipt.status === "reverted") {
                  throw new Error("Transfer EVM transaction reverted")
                }

                return txHash
              }),
              // TODO: Implement this
              validateTransaction: fromPromise(async () => true),
            },
            guards: {
              isDepositParamsValid: ({ context }) => {
                return context.depositAddress !== null
              },
            },
          }),
          depositSolanaActor: depositMachine.provide({
            actors: {
              signAndSendTransactions: fromPromise(async ({ input }) => {
                const {
                  amount,
                  depositAddress,
                  userAddress,
                  tokenDeployment,
                  solanaATACreationRequired,
                } = input

                assert(depositAddress != null, "Deposit address is not defined")

                const tx = createDepositSolanaTransaction({
                  userAddress,
                  depositAddress,
                  amount,
                  token: tokenDeployment,
                  ataExists: !solanaATACreationRequired,
                })

                const txHash = await sendTransactionSolana(tx)
                assert(txHash != null, "Tx hash is not defined")

                return txHash
              }),
              // TODO: Implement this
              validateTransaction: fromPromise(async () => true),
            },
            guards: {
              isDepositParamsValid: ({ context }) => {
                return context.depositAddress !== null
              },
            },
          }),
          depositTurboActor: depositMachine.provide({
            actors: {
              signAndSendTransactions: fromPromise(async ({ input }) => {
                const {
                  amount,
                  userAddress,
                  tokenDeployment,
                  depositAddress,
                  chainName,
                } = input

                assert(depositAddress != null, "Deposit address is not defined")

                const chainId = getEVMChainId(chainName)
                const siloToSiloAddress_ =
                  chainName in siloToSiloAddress
                    ? siloToSiloAddress[
                        chainName as keyof typeof siloToSiloAddress
                      ]
                    : null

                assert(siloToSiloAddress_ != null, "chainType should be EVM")

                if (!isNativeToken(tokenDeployment)) {
                  const allowance = await getAllowance(
                    tokenDeployment.address,
                    userAddress,
                    siloToSiloAddress_,
                    assetNetworkAdapter[chainName]
                  )
                  assert(allowance != null, "Allowance is not defined")

                  if (allowance < amount) {
                    const approveTx = createApproveTransaction(
                      tokenDeployment.address,
                      siloToSiloAddress_,
                      amount,
                      getAddress(userAddress),
                      chainId
                    )
                    logger.trace("Sending approve EVM transaction")
                    const approveTxHash = await sendTransactionEVM(approveTx)
                    assert(approveTxHash != null, "Transaction failed")

                    logger.trace("Waiting for approve EVM transaction", {
                      txHash: approveTxHash,
                    })
                    const receipt = await waitEVMTransaction({
                      txHash: approveTxHash,
                      chainName,
                    })
                    if (receipt.status === "reverted") {
                      throw new Error("Approve transaction reverted")
                    }
                  }
                }

                const tx = createDepositFromSiloTransaction(
                  isNativeToken(tokenDeployment)
                    ? "0x0000000000000000000000000000000000000000"
                    : tokenDeployment.address,
                  userAddress,
                  amount,
                  depositAddress,
                  siloToSiloAddress_,
                  isNativeToken(tokenDeployment) ? amount : 0n,
                  chainId
                )
                logger.trace("Sending deposit from Silo EVM transaction")
                const txHash = await sendTransactionEVM(tx)
                assert(txHash != null, "Transaction failed")

                logger.trace("Waiting for deposit from Silo EVM transaction", {
                  txHash,
                })
                const receipt = await waitEVMTransaction({ txHash, chainName })
                if (receipt.status === "reverted") {
                  throw new Error("Deposit from Silo transaction reverted")
                }

                return txHash
              }),
              // TODO: Implement this
              validateTransaction: fromPromise(async () => true),
            },
            guards: {
              isDepositParamsValid: ({ context }) => {
                return context.depositAddress !== null
              },
            },
          }),
          depositVirtualChainActor: depositMachine.provide({
            actors: {
              signAndSendTransactions: fromPromise(async ({ input }) => {
                const {
                  amount,
                  userAddress,
                  tokenDeployment,
                  depositAddress,
                  chainName,
                } = input

                assert(depositAddress != null, "Deposit address is required")
                const chainId = getEVMChainId(chainName)
                const precompileDepositAddress =
                  `${depositAddress}:${userAddress}`.toLowerCase()

                let tx: Transaction["EVM"]
                if (isNativeToken(tokenDeployment)) {
                  logger.trace(
                    "Sending deposit through exitToNearPrecompile contract"
                  )
                  tx = createExitToNearPrecompileTransaction(
                    userAddress,
                    amount,
                    precompileDepositAddress,
                    chainId
                  )
                } else {
                  logger.trace("Sending deposit through auroraErc20 contract")
                  tx = createDepositVirtualChainERC20Transaction(
                    userAddress,
                    tokenDeployment.address,
                    precompileDepositAddress,
                    amount,
                    chainId
                  )
                }
                const txHash = await sendTransactionEVM(tx)

                assert(txHash != null, "Transaction failed")

                logger.trace("Waiting for deposit transaction", { txHash })
                const receipt = await waitEVMTransaction({ txHash, chainName })
                if (receipt.status === "reverted") {
                  throw new Error("Deposit transaction reverted")
                }

                return txHash
              }),
              // TODO: Implement this
              validateTransaction: fromPromise(async () => true),
            },
            guards: {
              isDepositParamsValid: ({ context }) => {
                return context.depositAddress !== null
              },
            },
          }),
          depositTonActor: depositMachine.provide({
            actors: {
              signAndSendTransactions: fromPromise(async ({ input }) => {
                const {
                  amount,
                  tokenDeployment,
                  depositAddress,
                  userWalletAddress,
                } = input
                assert(depositAddress != null, "Deposit address is not defined")
                assert(
                  userWalletAddress != null,
                  "User wallet address is not defined"
                )

                const tx = await createDepositTonTransaction(
                  userWalletAddress,
                  depositAddress,
                  amount,
                  tokenDeployment
                )

                const txHash = await sendTransactionTon(tx)
                assert(txHash != null, "Transaction failed")
                logger.trace("Waiting for deposit TON transaction", {
                  txHash,
                })

                return txHash
              }),
              // TODO: Implement this
              validateTransaction: fromPromise(async () => true),
            },
            guards: {
              isDepositParamsValid: ({ context }) => {
                return context.depositAddress !== null
              },
            },
          }),
          depositStellarActor: depositMachine.provide({
            actors: {
              signAndSendTransactions: fromPromise(async ({ input }) => {
                const {
                  amount,
                  depositAddress,
                  userAddress,
                  tokenDeployment,
                  memo,
                } = input

                assert(depositAddress != null, "Deposit address is not defined")

                const tx = await createDepositStellarTransaction({
                  userAddress,
                  depositAddress,
                  amount,
                  token: tokenDeployment,
                  memo,
                })

                const txHash = await sendTransactionStellar(tx)
                assert(txHash != null, "Tx hash is not defined")
                logger.trace("Waiting for deposit Stellar transaction", {
                  txHash,
                })

                return txHash
              }),
              // TODO: Implement this
              validateTransaction: fromPromise(async () => true),
            },
            guards: {
              isDepositParamsValid: ({ context }) => {
                return context.depositAddress !== null
              },
            },
          }),
          depositTronActor: depositMachine.provide({
            actors: {
              signAndSendTransactions: fromPromise(async ({ input }) => {
                const { tokenDeployment, amount, depositAddress, userAddress } =
                  input

                assert(depositAddress != null, "Deposit address is not defined")

                let tx: Transaction["Tron"]
                if (isNativeToken(tokenDeployment)) {
                  tx = await createDepositTronNativeTransaction(
                    userAddress,
                    depositAddress,
                    amount
                  )
                } else {
                  tx = await createDepositTronTRC20Transaction(
                    userAddress,
                    tokenDeployment.address,
                    depositAddress,
                    amount
                  )
                }

                logger.trace("Sending transfer Tron transaction")
                const txHash = await sendTransactionTron(tx)
                assert(txHash != null, "Tx hash is not defined")

                logger.trace("Waiting for transfer Tron transaction", {
                  txHash,
                })

                return txHash
              }),
              // TODO: Implement this
              validateTransaction: fromPromise(async () => true),
            },
            guards: {
              isDepositParamsValid: ({ context }) => {
                return context.depositAddress !== null
              },
            },
          }),
        },
        actions: {
          clearUIDepositAmount: () => {
            setValue("amount", "")
          },
        },
      })}
    >
      <TokenChangeNotifier onTokenChange={onTokenChange} token={token} />
      {children}
    </DepositUIMachineContext.Provider>
  )
}

function TokenChangeNotifier({
  onTokenChange,
  token,
}: {
  onTokenChange?: (params: { token: TokenInfo | null }) => void
  token: TokenInfo
}) {
  useDepositTokenChangeNotifier({ onTokenChange, token })
  return null
}
