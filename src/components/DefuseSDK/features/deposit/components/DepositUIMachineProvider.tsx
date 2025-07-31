import { authIdentity } from "@defuse-protocol/internal-utils"
import { depositMachine } from "@src/components/DefuseSDK/features/machines/depositMachine"
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
import { logger } from "../../../logger"
import {
  checkNearTransactionValidity,
  createApproveTransaction,
  createBatchDepositNearNativeTransaction,
  createBatchDepositNearNep141Transaction,
  createDepositEVMERC20Transaction,
  createDepositEVMNativeTransaction,
  createDepositFromSiloTransaction,
  createDepositSolanaTransaction,
  createDepositTonTransaction,
  createDepositVirtualChainERC20Transaction,
  createExitToNearPrecompileTransaction,
  generateDepositAddress,
  getAllowance,
  waitEVMTransaction,
} from "../../../services/depositService"
import type { Transaction } from "../../../types/deposit"
import type { SwappableToken } from "../../../types/swap"
import { assetNetworkAdapter } from "../../../utils/adapters"
import { assert } from "../../../utils/assert"
import { getEVMChainId } from "../../../utils/evmChainId"
import { isFungibleToken, isNativeToken } from "../../../utils/token"
import { depositGenerateAddressMachine } from "../../machines/depositGenerateAddressMachine"
import { depositUIMachine } from "../../machines/depositUIMachine"
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
  tokenList: SwappableToken[]
  sendTransactionNear: (tx: Transaction["NEAR"][]) => Promise<string | null>
  sendTransactionEVM: (tx: Transaction["EVM"]) => Promise<Hash | null>
  sendTransactionSolana: (tx: Transaction["Solana"]) => Promise<string | null>
  sendTransactionTon: (tx: Transaction["TON"]) => Promise<string | null>
}

export function DepositUIMachineProvider({
  children,
  tokenList,
  sendTransactionNear,
  sendTransactionEVM,
  sendTransactionSolana,
  sendTransactionTon,
}: DepositUIMachineProviderProps) {
  const { setValue } = useFormContext<DepositFormValues>()
  return (
    <DepositUIMachineContext.Provider
      options={{
        input: {
          tokenList,
        },
      }}
      logic={depositUIMachine.provide({
        actors: {
          depositGenerateAddressActor: depositGenerateAddressMachine.provide({
            actors: {
              generateDepositAddress: fromPromise(async ({ input }) => {
                const { userAddress, blockchain, userChainType } = input

                const generatedResult = await generateDepositAddress(
                  authIdentity.authHandleToIntentsUserId(
                    userAddress,
                    userChainType
                  ),
                  assetNetworkAdapter[blockchain]
                )

                return {
                  generateDepositAddress:
                    generatedResult.generatedDepositAddress,
                  memo: generatedResult.memo,
                }
              }),
            },
          }),
          depositNearActor: depositMachine.provide({
            actors: {
              signAndSendTransactions: fromPromise(async ({ input }) => {
                const {
                  derivedToken,
                  balance,
                  amount,
                  nearBalance,
                  storageDepositRequired,
                } = input
                const address = isFungibleToken(derivedToken)
                  ? derivedToken.address
                  : null

                assert(address != null, "Address is not defined")
                assert(
                  storageDepositRequired !== null,
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
                    storageDepositRequired > 0n ? storageDepositRequired : 0n
                  )
                } else {
                  tx = createBatchDepositNearNep141Transaction(
                    address,
                    amount,
                    storageDepositRequired
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
                  context.storageDepositRequired !== null &&
                  context.nearBalance !== null
                )
              },
            },
          }),
          depositEVMActor: depositMachine.provide({
            actors: {
              signAndSendTransactions: fromPromise(async ({ input }) => {
                const {
                  derivedToken,
                  amount,
                  depositAddress,
                  userAddress,
                  chainName,
                } = input
                const chainId = getEVMChainId(chainName)

                assert(depositAddress != null, "Deposit address is not defined")

                let tx: Transaction["EVM"]
                if (isNativeToken(derivedToken)) {
                  tx = createDepositEVMNativeTransaction(
                    userAddress,
                    depositAddress,
                    amount,
                    chainId
                  )
                } else {
                  tx = createDepositEVMERC20Transaction(
                    userAddress,
                    derivedToken.address,
                    depositAddress,
                    amount,
                    chainId
                  )
                }

                logger.verbose("Sending transfer EVM transaction")
                const txHash = await sendTransactionEVM(tx)
                assert(txHash != null, "Tx hash is not defined")

                logger.verbose("Waiting for transfer EVM transaction", {
                  txHash,
                })
                const receipt = await waitEVMTransaction({ txHash, chainName })
                if (receipt.status === "reverted") {
                  throw new Error("Transfer EVM transaction reverted")
                }

                return txHash
              }),
              // todo: add `validateTransaction` actor
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
                  derivedToken,
                  solanaATACreationRequired,
                } = input

                assert(depositAddress != null, "Deposit address is not defined")

                const tx = createDepositSolanaTransaction({
                  userAddress,
                  depositAddress,
                  amount,
                  token: derivedToken,
                  ataExists: !solanaATACreationRequired,
                })

                const txHash = await sendTransactionSolana(tx)
                assert(txHash != null, "Tx hash is not defined")

                return txHash
              }),
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
                  derivedToken,
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

                if (!isNativeToken(derivedToken)) {
                  const allowance = await getAllowance(
                    derivedToken.address,
                    userAddress,
                    siloToSiloAddress_,
                    assetNetworkAdapter[chainName]
                  )
                  assert(allowance != null, "Allowance is not defined")

                  if (allowance < amount) {
                    const approveTx = createApproveTransaction(
                      derivedToken.address,
                      siloToSiloAddress_,
                      amount,
                      getAddress(userAddress),
                      chainId
                    )
                    logger.verbose("Sending approve EVM transaction")
                    const approveTxHash = await sendTransactionEVM(approveTx)
                    assert(approveTxHash != null, "Transaction failed")

                    logger.verbose("Waiting for approve EVM transaction", {
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
                  isNativeToken(derivedToken)
                    ? "0x0000000000000000000000000000000000000000"
                    : derivedToken.address,
                  userAddress,
                  amount,
                  depositAddress,
                  siloToSiloAddress_,
                  isNativeToken(derivedToken) ? amount : 0n,
                  chainId
                )
                logger.verbose("Sending deposit from Silo EVM transaction")
                const txHash = await sendTransactionEVM(tx)
                assert(txHash != null, "Transaction failed")

                logger.verbose(
                  "Waiting for deposit from Silo EVM transaction",
                  { txHash }
                )
                const receipt = await waitEVMTransaction({ txHash, chainName })
                if (receipt.status === "reverted") {
                  throw new Error("Deposit from Silo transaction reverted")
                }

                return txHash
              }),
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
                  derivedToken,
                  depositAddress,
                  chainName,
                } = input

                assert(depositAddress != null, "Deposit address is required")
                const chainId = getEVMChainId(chainName)
                const precompileDepositAddress =
                  `${depositAddress}:${userAddress}`.toLowerCase()

                let tx: Transaction["EVM"]
                if (isNativeToken(derivedToken)) {
                  logger.verbose(
                    "Sending deposit through exitToNearPrecompile contract"
                  )
                  tx = createExitToNearPrecompileTransaction(
                    userAddress,
                    amount,
                    precompileDepositAddress,
                    chainId
                  )
                } else {
                  logger.verbose("Sending deposit through auroraErc20 contract")
                  tx = createDepositVirtualChainERC20Transaction(
                    userAddress,
                    derivedToken.address,
                    precompileDepositAddress,
                    amount,
                    chainId
                  )
                }
                const txHash = await sendTransactionEVM(tx)

                assert(txHash != null, "Transaction failed")

                logger.verbose("Waiting for deposit transaction", { txHash })
                const receipt = await waitEVMTransaction({ txHash, chainName })
                if (receipt.status === "reverted") {
                  throw new Error("Deposit transaction reverted")
                }

                return txHash
              }),
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
                  derivedToken,
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
                  derivedToken
                )

                const txHash = await sendTransactionTon(tx)
                assert(txHash != null, "Transaction failed")
                logger.verbose("Waiting for deposit TON transaction", {
                  txHash,
                })

                return txHash
              }),
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
      {children}
    </DepositUIMachineContext.Provider>
  )
}
