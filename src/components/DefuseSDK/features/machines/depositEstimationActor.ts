import { BlockchainEnum } from "@defuse-protocol/internal-utils"
import { getWalletRpcUrl } from "@src/components/DefuseSDK/services/depositService"
import { logger } from "@src/utils/logger"
import type { Address } from "viem"
import { assign, fromPromise, setup } from "xstate"
import {
  estimateEVMTransferCost,
  estimateSolanaTransferCost,
  estimateStellarXLMTransferCost,
  estimateTonTransferCost,
  estimateTronTransferCost,
} from "../../services/estimateService"
import type { SupportedChainName, TokenDeployment } from "../../types/base"
import { assetNetworkAdapter } from "../../utils/adapters"
import { isFungibleToken, isNativeToken } from "../../utils/token"
import { validateAddress } from "../../utils/validateAddress"

export const depositEstimateMaxValueActor = fromPromise(
  async ({
    input: {
      blockchain,
      userAddress,
      balance,
      nearBalance,
      token,
      generateAddress,
    },
  }: {
    input: {
      blockchain: SupportedChainName
      userAddress: string
      balance: bigint
      nearBalance: bigint | null
      token: TokenDeployment
      generateAddress: string | null
    }
  }): Promise<bigint> => {
    const networkToSolverFormat = assetNetworkAdapter[blockchain]
    switch (networkToSolverFormat) {
      case BlockchainEnum.NEAR:
        // Max value for NEAR is the sum of the selected token balance (wrap.near) and the NEAR native balance
        if (isFungibleToken(token) && token.address === "wrap.near") {
          // nearBalance is always null for passive deposits from non-NEAR wallets
          return nearBalance ?? 0n + balance
        }
        return balance
      case BlockchainEnum.ETHEREUM:
      case BlockchainEnum.BASE:
      case BlockchainEnum.ARBITRUM:
      case BlockchainEnum.TURBOCHAIN:
      case BlockchainEnum.TUXAPPCHAIN:
      case BlockchainEnum.VERTEX:
      case BlockchainEnum.OPTIMA:
      case BlockchainEnum.EASYCHAIN:
      case BlockchainEnum.HAKO:
      case BlockchainEnum.AURORA:
      case BlockchainEnum.AURORA_DEVNET:
      case BlockchainEnum.GNOSIS:
      case BlockchainEnum.BERACHAIN:
      case BlockchainEnum.POLYGON:
      case BlockchainEnum.BSC:
      case BlockchainEnum.OPTIMISM:
      case BlockchainEnum.AVALANCHE:
      case BlockchainEnum.MONAD:
      case BlockchainEnum.LAYERX: {
        if (
          !validateAddress(userAddress, blockchain) ||
          generateAddress == null ||
          !isNativeToken(token)
        ) {
          return 0n
        }
        const rpcUrl = getWalletRpcUrl(assetNetworkAdapter[blockchain])
        const fee = await estimateEVMTransferCost({
          rpcUrl,
          from: userAddress as Address,
          to: generateAddress as Address,
        })
        if (balance < fee) {
          return 0n
        }
        return balance - fee
      }
      case BlockchainEnum.SOLANA: {
        if (!isNativeToken(token)) {
          return 0n
        }
        const fee = estimateSolanaTransferCost()
        if (balance < fee) {
          return 0n
        }
        return balance - fee
      }
      case BlockchainEnum.TON: {
        const isJetton = !isNativeToken(token)
        const fee = estimateTonTransferCost(isJetton)
        if (balance < fee) {
          return 0n
        }
        return balance - fee
      }
      case BlockchainEnum.STELLAR: {
        const rpcUrl = getWalletRpcUrl(assetNetworkAdapter[blockchain])
        if (!isNativeToken(token)) {
          return 0n
        }
        const fee = await estimateStellarXLMTransferCost({
          rpcUrl,
          userAddress,
        })
        if (balance < fee) {
          return 0n
        }
        return balance - fee
      }
      case BlockchainEnum.TRON: {
        if (!isNativeToken(token)) {
          return 0n
        }
        const rpcUrl = getWalletRpcUrl(assetNetworkAdapter[blockchain])
        const fee = await estimateTronTransferCost({
          rpcUrl,
          from: userAddress,
          to: generateAddress ?? null,
        })
        if (balance < fee) {
          return 0n
        }
        return balance - fee
      }
      // For next blockchains - active deposits are not supported, so no network fees
      case BlockchainEnum.BITCOIN:
      case BlockchainEnum.DOGECOIN:
      case BlockchainEnum.XRPLEDGER:
      case BlockchainEnum.ZCASH:
      case BlockchainEnum.HYPERLIQUID:
      case BlockchainEnum.SUI:
      case BlockchainEnum.APTOS:
      case BlockchainEnum.CARDANO:
      case BlockchainEnum.LITECOIN:
        return 0n
      default:
        networkToSolverFormat satisfies never
        throw new Error("exhaustive check failed")
    }
  }
)

export interface Context {
  preparationOutput:
    | {
        tag: "ok"
        value: {
          maxDepositValue: bigint
        }
      }
    | {
        tag: "err"
        value: { reason: "ERR_ESTIMATE_MAX_DEPOSIT_VALUE" }
      }
    | null
}

export const depositEstimationMachine = setup({
  types: {
    context: {} as Context,
    events: {} as {
      type: "REQUEST_ESTIMATE_MAX_DEPOSIT_VALUE"
      params: {
        blockchain: SupportedChainName
        userAddress: string
        balance: bigint
        nearBalance: bigint | null
        token: TokenDeployment
        generateAddress: string | null
      }
    },
  },
  actors: {
    estimateMaxDepositValueActor: depositEstimateMaxValueActor,
  },
  actions: {
    logError: (_, { error }: { error: unknown }) => {
      logger.error(error)
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QTABwPawJYBcCisOWAtgIZHoB2AxAEp4CKAqngMoAqA+m+wJICyAQXZ5OQgBqcAIngAKAeVa8uANUEAZFgG0ADAF1EoDNgqVDIAB6IALACYANCACeiAIw7bAOgCcAdgBs-q4AHNZ23h4ArLYAvjGOKMa4BERkpp5wqeRYlFDUEFRgnjkAbugA1kWJmMmEJNlUGXVpOVAIpegAxg2Uunp95kmm5lYIwa6ewb6ROq6uAMzuHq7WwY4uCPPRnovBtr6ufjoB1t6RcQloNfjNPU1ZRLnUYABOL+gvnqgANuQAZh9iJ5qiYUvV0plwa12pQyt1TH0BkgQEMsFQRog9p5IuEDqd5gFXJFfOsbLZrD4QvN-MFvLZXL5rDS4vEQJR0Ch4MiQbUHmizMjUejkaMALS+eaeFbjBl2HRhKb+UkIImeawBSLBeWRGmMsLWC4gHk3PmNLAQb5gQbXfkYhCi2yRKWrOaM2zy1bTJXONxatWhKaRbxzUL+CWG41glqNSEtXLWky2kWIGk7IME4PE7zeGnWZWHCmLfzzT3Z1z+JkG1mR27pTroYg-MA4SAJ3BJ0CjcsUvz+YkHYvWHTHSLKnX+Ty+bxbEs6PY6fzTlkxIA */
  id: "depositEstimation",

  context: {
    preparationOutput: null,
  },

  initial: "idle",

  states: {
    idle: {},

    estimating: {
      invoke: {
        src: "estimateMaxDepositValueActor",
        input: ({ event }) => {
          return event.params
        },

        onDone: {
          target: "completed",
          actions: assign({
            preparationOutput: ({ event }) => {
              if (event.output) {
                return {
                  tag: "ok",
                  value: {
                    maxDepositValue: event.output,
                  },
                }
              }
              return null
            },
          }),
        },
        onError: {
          target: "completed",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            assign({
              preparationOutput: {
                tag: "err",
                value: { reason: "ERR_ESTIMATE_MAX_DEPOSIT_VALUE" },
              },
            }),
          ],
          reenter: true,
        },
      },
    },
    completed: {},
  },

  on: {
    REQUEST_ESTIMATE_MAX_DEPOSIT_VALUE: ".estimating",
  },
})
