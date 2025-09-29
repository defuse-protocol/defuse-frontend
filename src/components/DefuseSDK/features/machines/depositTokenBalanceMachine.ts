import { BlockchainEnum } from "@defuse-protocol/internal-utils"
import { settings } from "@src/components/DefuseSDK/constants/settings"
import {
  checkTonJettonWalletRequired,
  createTonClient,
} from "@src/components/DefuseSDK/services/tonJettonService"
import { logger } from "@src/utils/logger"
import { shallowEqualObjects } from "@src/utils/object"
import type { Address } from "viem"
import { assign, enqueueActions, fromPromise, setup } from "xstate"
import {
  getEvmErc20Balance,
  getEvmNativeBalance,
  getNearNativeBalance,
  getNearNep141Balance,
  getSolanaNativeBalance,
  getSolanaSplBalance,
  getStellarBalance,
  getTonJettonBalance,
  getTonNativeBalance,
  getTronNativeBalance,
  getTronTrc20Balance,
} from "../../services/blockchainBalanceService"
import { getWalletRpcUrl } from "../../services/depositService"
import type { BaseTokenInfo, SupportedChainName } from "../../types/base"
import { assetNetworkAdapter } from "../../utils/adapters"
import { assert } from "../../utils/assert"
import { isFungibleToken, isNativeToken } from "../../utils/token"
import { validateAddress } from "../../utils/validateAddress"

export const backgroundBalanceActor = fromPromise(
  async ({
    input: { derivedToken, userWalletAddress, blockchain },
  }: {
    input: {
      derivedToken: BaseTokenInfo
      userWalletAddress: string | null
      blockchain: SupportedChainName
    }
  }): Promise<{
    balance: bigint
    nearBalance: bigint | null
  } | null> => {
    const result: {
      balance: bigint
      nearBalance: bigint | null
    } | null = {
      balance: 0n,
      nearBalance: null,
    }

    if (
      userWalletAddress === null ||
      !validateAddress(userWalletAddress, blockchain)
    ) {
      return result
    }

    const networkToSolverFormat = assetNetworkAdapter[blockchain]
    switch (networkToSolverFormat) {
      case BlockchainEnum.NEAR: {
        const address = isFungibleToken(derivedToken)
          ? derivedToken.address
          : null
        assert(address != null, "Address is not defined")

        const [nep141Balance, nativeBalance] = await Promise.all([
          getNearNep141Balance({
            tokenAddress: address,
            accountId: normalizeToNearAddress(userWalletAddress),
          }),
          getNearNativeBalance({
            accountId: normalizeToNearAddress(userWalletAddress),
          }),
        ])

        if (nep141Balance === null) {
          throw new Error("Failed to fetch nep141 NEAR balance")
        }

        // This is unique case for NEAR, where we need to sum up the native balance and the NEP-141 balance
        if (address === "wrap.near") {
          if (nativeBalance === null) {
            throw new Error("Failed to fetch native NEAR balance")
          }
          result.balance = nep141Balance + nativeBalance
          result.nearBalance = nativeBalance
          break
        }
        result.balance = nep141Balance
        result.nearBalance = nativeBalance
        break
      }
      case BlockchainEnum.ETHEREUM:
      case BlockchainEnum.BASE:
      case BlockchainEnum.ARBITRUM:
      case BlockchainEnum.TURBOCHAIN:
      case BlockchainEnum.TUXAPPCHAIN:
      case BlockchainEnum.VERTEX:
      case BlockchainEnum.OPTIMA:
      case BlockchainEnum.EASYCHAIN:
      case BlockchainEnum.AURORA:
      case BlockchainEnum.AURORA_DEVNET:
      case BlockchainEnum.GNOSIS:
      case BlockchainEnum.BERACHAIN:
      case BlockchainEnum.POLYGON:
      case BlockchainEnum.BSC:
      case BlockchainEnum.OPTIMISM:
      case BlockchainEnum.AVALANCHE: {
        if (isNativeToken(derivedToken)) {
          const balance = await getEvmNativeBalance({
            userAddress: userWalletAddress as Address,
            rpcUrl: getWalletRpcUrl(networkToSolverFormat),
          })
          if (balance === null) {
            throw new Error("Failed to fetch EVM balances")
          }
          result.balance = balance
          break
        }
        const balance = await getEvmErc20Balance({
          tokenAddress: derivedToken.address as Address,
          userAddress: userWalletAddress as Address,
          rpcUrl: getWalletRpcUrl(networkToSolverFormat),
        })
        if (balance === null) {
          throw new Error("Failed to fetch EVM balances")
        }
        result.balance = balance
        break
      }
      case BlockchainEnum.SOLANA: {
        if (isNativeToken(derivedToken)) {
          const balance = await getSolanaNativeBalance({
            userAddress: userWalletAddress,
            rpcUrl: getWalletRpcUrl(networkToSolverFormat),
          })
          if (balance === null) {
            throw new Error("Failed to fetch SOLANA balances")
          }
          result.balance = balance
          break
        }

        const balance = await getSolanaSplBalance({
          userAddress: userWalletAddress,
          tokenAddress: derivedToken.address,
          rpcUrl: getWalletRpcUrl(networkToSolverFormat),
        })
        if (balance === null) {
          throw new Error("Failed to fetch SOLANA balances")
        }
        result.balance = balance
        break
      }
      case BlockchainEnum.TON: {
        if (isNativeToken(derivedToken)) {
          const balance = await getTonNativeBalance({
            userAddress: userWalletAddress,
            rpcUrl: getWalletRpcUrl(networkToSolverFormat),
          })
          if (balance === null) {
            throw new Error("Failed to fetch TON balances")
          }
          result.balance = balance
          break
        }

        const isJettonWalletCreationRequired =
          await checkTonJettonWalletRequired(
            createTonClient(settings.rpcUrls.ton),
            derivedToken,
            userWalletAddress
          )
        if (isJettonWalletCreationRequired) {
          result.balance = 0n
          break
        }

        const balance = await getTonJettonBalance({
          tokenAddress: derivedToken.address,
          userAddress: userWalletAddress,
          rpcUrl: getWalletRpcUrl(networkToSolverFormat),
        })
        if (balance === null) {
          throw new Error("Failed to fetch TON balances")
        }
        result.balance = balance
        break
      }
      case BlockchainEnum.STELLAR: {
        const balance = await getStellarBalance({
          tokenAddress: !isNativeToken(derivedToken)
            ? derivedToken.address
            : null,
          tokenDecimals: derivedToken.decimals,
          userAddress: userWalletAddress,
          rpcUrl: getWalletRpcUrl(networkToSolverFormat),
        })
        if (balance === null) {
          throw new Error("Failed to fetch STELLAR balances")
        }
        result.balance = balance
        break
      }
      case BlockchainEnum.TRON: {
        if (isNativeToken(derivedToken)) {
          const balance = await getTronNativeBalance({
            userAddress: userWalletAddress,
            rpcUrl: getWalletRpcUrl(networkToSolverFormat),
          })
          if (balance === null) {
            throw new Error("Failed to fetch TRON balances")
          }
          result.balance = balance
          break
        }
        const balance = await getTronTrc20Balance({
          tokenAddress: derivedToken.address,
          userAddress: userWalletAddress,
          rpcUrl: getWalletRpcUrl(networkToSolverFormat),
        })
        if (balance === null) {
          throw new Error("Failed to fetch TRON balances")
        }
        result.balance = balance
        break
      }
      // Active deposits through Bitcoin and other blockchains are not supported, so we don't need to check balances
      case BlockchainEnum.BITCOIN:
      case BlockchainEnum.DOGECOIN:
      case BlockchainEnum.XRPLEDGER:
      case BlockchainEnum.ZCASH:
      case BlockchainEnum.HYPERLIQUID:
      case BlockchainEnum.SUI:
      case BlockchainEnum.APTOS:
      case BlockchainEnum.CARDANO:
        break
      default:
        networkToSolverFormat satisfies never
        throw new Error("exhaustive check failed")
    }
    return result
  }
)

function normalizeToNearAddress(address: string): string {
  return address.toLowerCase()
}

export interface Context {
  lastBalanceRequestParams: null | {
    derivedToken: BaseTokenInfo
    userAddress: string
    userWalletAddress: string | null
    blockchain: SupportedChainName
  }
  preparationOutput:
    | {
        tag: "ok"
        value: {
          balance: bigint
          nearBalance: bigint | null
        }
      }
    | {
        tag: "err"
        value: { reason: "ERR_FETCH_BALANCE" }
      }
    | null
}

export const depositTokenBalanceMachine = setup({
  types: {
    context: {} as Context,
    events: {} as {
      type: "REQUEST_BALANCE_REFRESH"
      params: {
        derivedToken: BaseTokenInfo
        userAddress: string
        userWalletAddress: string | null
        blockchain: SupportedChainName
      }
    },
  },
  actors: {
    fetchBalanceActor: backgroundBalanceActor,
  },
  actions: {
    clearBalance: assign({
      preparationOutput: null,
    }),
    setLastBalanceRequestParams: assign({
      lastBalanceRequestParams: ({ event }) => {
        return {
          derivedToken: event.params.derivedToken,
          userAddress: event.params.userAddress,
          userWalletAddress: event.params.userWalletAddress,
          blockchain: event.params.blockchain,
        }
      },
    }),
  },
  guards: {},
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QTABwPawJYBdICEBDAG0IDsBjMAYgCUBRARQFV6BlAFQH18BBAGV4A5AML0uDAGIM2ACQDaABgC6iUBmw4s6MmpAAPRAFoATABYArADoTADgDM9gJwB2M2fuKXARlsA2ABoQAE9jbydbKxcLF3Mvew9bE1iAXxSglA1cAhJyKisAMzAcCgALLDIoaggdMCsKgDd0AGs6zMxsiCJSSjqikvLKhEb0CkItHSVlKb0sid0kA2MTb3srJz8-JyczW1sLOL8XINCEMycrJO8fC19bRQt9kzSMtA68LtzewuKyiqqwAAnQHoQFWVCkHAFUEAWys7U0OR6+X6fyGIzG8ymM0Wc20C1AhgQplWNm2insLic4RcR1sZhOiG8JjWGws9m87JZjnuzxeIDI6BQ8EWCM63TyYFm73xeiJRns9MuzKpfnsW05HMZxLsfhsMXMB1ifnZLn5Yo+Eu+WAgxCluJlOjlxkcetsKo26up7O82qMq28628FJM1J87v8fnNb0Rn2RfV+gyg0s0ssW8pMySsuxMfncwcU3jMJvsfu85asiirVZN7icijVZmjcyRkqsFHQMIhxUgKdwacJYRciisfgpbgeWz8vl22rsLmzhdsrh8ZkUDgsaTSQA */
  id: "depositedBalance",

  context: {
    lastBalanceRequestParams: null,
    preparationOutput: null,
  },

  initial: "idle",

  states: {
    idle: {},

    fetching: {
      invoke: {
        src: "fetchBalanceActor",

        input: ({ event }) => ({
          derivedToken: event.params.derivedToken,
          userWalletAddress: event.params.userWalletAddress,
          blockchain: event.params.blockchain,
        }),

        onDone: {
          target: "completed",
          actions: assign({
            preparationOutput: ({ event }) => {
              if (event.output) {
                return {
                  tag: "ok",
                  value: {
                    balance: event.output.balance,
                    nearBalance: event.output.nearBalance,
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
            ({ event }) => {
              logger.error(event.error)
            },
            assign({
              preparationOutput: {
                tag: "err",
                value: {
                  reason: "ERR_FETCH_BALANCE",
                },
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
    REQUEST_BALANCE_REFRESH: {
      target: ".fetching",
      actions: [
        /**
         * Clear balance only if input changed, to not accidentally display an incorrect number.
         */
        enqueueActions(({ enqueue, context, event }) => {
          if (
            context.lastBalanceRequestParams != null &&
            !shallowEqualObjects(event.params, context.lastBalanceRequestParams)
          ) {
            enqueue("clearBalance")
          }
        }),
        "setLastBalanceRequestParams",
      ],
    },
  },
})
