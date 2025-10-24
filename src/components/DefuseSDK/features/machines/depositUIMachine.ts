import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { assert } from "@src/components/DefuseSDK/utils/assert"
import { logger } from "@src/utils/logger"
import {
  type ActorRefFrom,
  type EventFrom,
  and,
  assertEvent,
  assign,
  enqueueActions,
  sendTo,
  setup,
} from "xstate"
import { config } from "../../config"
import { clearSolanaATACache } from "../../services/depositService"
import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenDeployment,
} from "../../types/base"
import type { TokenInfo } from "../../types/base"
import {
  type ParentEvents as Background1csQuoterParentEvents,
  background1csQuoterMachine,
} from "./background1csQuoterMachine"
import { depositEstimationMachine } from "./depositEstimationActor"
import {
  type Events as DepositFormEvents,
  type ParentEvents as DepositFormParentEvents,
  DepositMode,
  type Fields,
  depositFormReducer,
} from "./depositFormReducer"
import { depositGenerateAddressMachine } from "./depositGenerateAddressMachine"
import { type Output as DepositOutput, depositMachine } from "./depositMachine"
import { depositTokenBalanceMachine } from "./depositTokenBalanceMachine"
import { oneClickStatusMachine } from "./oneClickStatusMachine"
import { poaBridgeInfoActor } from "./poaBridgeInfoActor"
import {
  type PreparationOutput,
  prepareDepositActor,
} from "./prepareDepositActor"
import { storageDepositAmountMachine } from "./storageDepositAmountMachine"
import { getBaseTokenInfoWithFallback } from "./withdrawFormReducer"

export type Context = {
  depositGenerateAddressRef: ActorRefFrom<typeof depositGenerateAddressMachine>
  poaBridgeInfoRef: ActorRefFrom<typeof poaBridgeInfoActor>
  tokenList: TokenInfo[]
  userAddress: string | null
  userWalletAddress: string | null
  userChainType: AuthMethod | null
  depositFormRef: ActorRefFrom<typeof depositFormReducer>
  preparationOutput: PreparationOutput | null
  storageDepositAmountRef: ActorRefFrom<typeof storageDepositAmountMachine>
  depositTokenBalanceRef: ActorRefFrom<typeof depositTokenBalanceMachine>
  depositEstimationRef: ActorRefFrom<typeof depositEstimationMachine>
  depositOutput: DepositOutput | null
  intentRefs: ActorRefFrom<typeof oneClickStatusMachine>[]
  is1cs: boolean
}

export const ONE_CLICK_PREFIX = "oneclick-"

export const depositUIMachine = setup({
  types: {
    input: {} as {
      tokenList: TokenInfo[]
      token: TokenInfo
      is1cs: boolean
    },
    context: {} as Context,
    events: {} as
      | {
          type: "SUBMIT"
        }
      | {
          type: "LOGIN"
          params: {
            userAddress: string
            userWalletAddress: string | null
            userChainType: AuthMethod
          }
        }
      | {
          type: "LOGOUT"
        }
      | DepositFormEvents
      | DepositFormParentEvents
      | Background1csQuoterParentEvents
      | {
          type: "ONE_CLICK_SETTLED"
          data: {
            depositAddress: string
            status: string
            tokenIn: TokenInfo
            tokenOut: TokenInfo
          }
        },
    children: {} as {
      depositNearRef: "depositNearActor"
      depositEVMRef: "depositEVMActor"
      depositSolanaRef: "depositSolanaActor"
      depositTurboRef: "depositTurboActor"
      depositVirtualChainRef: "depositVirtualChainActor"
      depositTonRef: "depositTonActor"
      background1csQuoterRef: "background1csQuoterActor"
    },
  },
  actors: {
    poaBridgeInfoActor: poaBridgeInfoActor,
    depositNearActor: depositMachine,
    depositEVMActor: depositMachine,
    depositSolanaActor: depositMachine,
    depositTurboActor: depositMachine,
    depositVirtualChainActor: depositMachine,
    depositTonActor: depositMachine,
    depositStellarActor: depositMachine,
    depositTronActor: depositMachine,
    prepareDepositActor: prepareDepositActor,
    depositFormActor: depositFormReducer,
    depositGenerateAddressActor: depositGenerateAddressMachine,
    storageDepositAmountActor: storageDepositAmountMachine,
    depositTokenBalanceActor: depositTokenBalanceMachine,
    depositEstimationActor: depositEstimationMachine,
    background1csQuoterActor: background1csQuoterMachine,
    oneClickStatusActor: oneClickStatusMachine,
  },
  actions: {
    logError: (_, event: { error: unknown }) => {
      logger.error(event.error)
    },
    setDepositOutput: assign({
      depositOutput: (_, params: DepositOutput) => params,
    }),
    setPreparationOutput: assign({
      preparationOutput: (_, params: PreparationOutput) => params,
    }),
    resetPreparationOutput: assign({
      preparationOutput: null,
    }),

    clearResults: assign({
      depositOutput: null,
    }),
    clearUIDepositAmount: () => {
      throw new Error("not implemented")
    },
    clearSolanaATACache: ({ context }) => {
      const { tokenDeployment } = context.depositFormRef.getSnapshot().context
      const depositAddress =
        context.preparationOutput?.tag === "ok"
          ? context.preparationOutput.value.generateDepositAddress
          : null

      if (tokenDeployment != null && depositAddress != null) {
        clearSolanaATACache(tokenDeployment, depositAddress)
      }
    },

    fetchPOABridgeInfo: sendTo("poaBridgeInfoRef", { type: "FETCH" }),

    relayToDepositFormRef: sendTo(
      "depositFormRef",
      (_, event: DepositFormEvents) => event
    ),

    requestGenerateAddress: sendTo(
      "depositGenerateAddressRef",
      ({ context }) => {
        const { userAddress, userChainType } = context
        const { token, derivedToken, parsedAmount, depositMode, blockchain } =
          context.depositFormRef.getSnapshot().context
        assert(token != null, "token is null")
        assert(derivedToken != null, "derivedToken is null")

        return {
          type: "REQUEST_GENERATE_ADDRESS",
          params: {
            userAddress,
            userChainType,
            blockchain,
            tokenIn: derivedToken,
            tokenOut: getBaseTokenInfoWithFallback(token, null),
            amountIn: {
              amount: parsedAmount ?? 0n,
              decimals: derivedToken.decimals,
            },
            depositMode,
          },
        }
      }
    ),
    requestClearAddress: sendTo("depositGenerateAddressRef", () => ({
      type: "REQUEST_CLEAR_ADDRESS",
    })),
    // @ts-expect-error Weird xstate type error, which should not be thrown
    requestBalanceRefresh: enqueueActions(({ enqueue, context }) => {
      const { blockchain, tokenDeployment } =
        context.depositFormRef.getSnapshot().context
      const { userAddress, userWalletAddress } = context

      if (
        userAddress != null &&
        blockchain != null &&
        tokenDeployment != null
      ) {
        enqueue.sendTo(
          "depositTokenBalanceRef",
          (): EventFrom<typeof depositTokenBalanceMachine> => {
            return {
              type: "REQUEST_BALANCE_REFRESH",
              params: {
                tokenDeployment,
                blockchain,
                userAddress,
                userWalletAddress,
              },
            }
          }
        )
      }
    }),
    // @ts-expect-error Weird xstate type error, which should not be thrown
    refreshBalanceIfNeeded: enqueueActions(
      ({ enqueue }, { fields }: { fields: Fields }) => {
        if (fields.includes("token") || fields.includes("blockchain")) {
          enqueue("requestBalanceRefresh")
        }
      }
    ),
    requestStorageDepositAmount: sendTo(
      "storageDepositAmountRef",
      ({ context }) => {
        return {
          type: "REQUEST_STORAGE_DEPOSIT",
          params: {
            token: context.depositFormRef.getSnapshot().context.derivedToken,
            userAccountId: context.userAddress,
          },
        }
      }
    ),
    spawnIntentStatusActor: assign({
      intentRefs: ({ context, spawn, self }, output: DepositOutput) => {
        if (output.tag !== "ok") return context.intentRefs
        const { depositMode } = context.depositFormRef.getSnapshot().context
        const depositDescription = output.value.depositDescription

        if (depositMode === DepositMode.ONE_CLICK && depositDescription) {
          const { derivedToken, tokenDeployment, amount, depositAddress } =
            depositDescription
          assert(depositAddress != null, "depositAddress is null")

          const oneClickRef = spawn("oneClickStatusActor", {
            id: `${ONE_CLICK_PREFIX}${depositAddress}`,
            input: {
              parentRef: self,
              intentHash: "null", // TODO: since we don't have signatureData to publish intent and get intentHash so optionaly we might tyry get it from quoute if this is possible
              depositAddress: depositAddress,
              tokenIn: derivedToken,
              tokenOut: derivedToken,
              totalAmountIn: { amount, decimals: derivedToken.decimals },
              totalAmountOut: { amount, decimals: tokenDeployment.decimals },
            },
          })

          return [oneClickRef, ...context.intentRefs]
        }

        return context.intentRefs
      },
    }),
  },
  guards: {
    isTokenValid: ({ context }) => {
      return !!context.depositFormRef.getSnapshot().context.token
    },
    isNetworkValid: ({ context }) => {
      return !!context.depositFormRef.getSnapshot().context.blockchain
    },
    isLoggedIn: ({ context }) => {
      return !!context.userAddress
    },
    isChainNearSelected: ({ context }) => {
      return context.depositFormRef.getSnapshot().context.blockchain === "near"
    },
    isChainEVMSelected: ({ context }) => {
      const blockchain = context.depositFormRef.getSnapshot().context.blockchain
      return (
        blockchain === "eth" ||
        blockchain === "base" ||
        blockchain === "arbitrum" ||
        blockchain === "gnosis" ||
        blockchain === "berachain" ||
        blockchain === "polygon" ||
        blockchain === "bsc" ||
        blockchain === "optimism" ||
        blockchain === "avalanche"
      )
    },
    isChainSolanaSelected: ({ context }) => {
      return (
        context.depositFormRef.getSnapshot().context.blockchain === "solana"
      )
    },
    isChainAuroraEngineSelected: ({ context }) => {
      const blockchain = context.depositFormRef.getSnapshot().context.blockchain
      return blockchain === "turbochain" || blockchain === "aurora"
    },
    isVirtualChainSelected: ({ context }) => {
      const blockchain = context.depositFormRef.getSnapshot().context.blockchain
      return [
        "tuxappchain",
        "vertex",
        "optima",
        "easychain",
        "aurora_devnet",
      ].includes(blockchain ?? "")
    },
    isChainTonSelected: ({ context }) => {
      return context.depositFormRef.getSnapshot().context.blockchain === "ton"
    },
    isChainStellarSelected: ({ context }) => {
      return (
        context.depositFormRef.getSnapshot().context.blockchain === "stellar"
      )
    },
    isChainTronSelected: ({ context }) => {
      return context.depositFormRef.getSnapshot().context.blockchain === "tron"
    },
    isOk: (_, a: { tag: "err" | "ok" }) => a.tag === "ok",
    isDepositParamsComplete: and([
      "isTokenValid",
      "isNetworkValid",
      "isLoggedIn",
    ]),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QTABwPawJYBcC0ArlgMQAyA8gOICSAcgNoAMAuoqBtjlugHZsgAPRAFYAzADYAdAHZxADgAscgEwLpjCQE5hAGhABPRHmXTRkxvICMy5eKULLD4QF9nelB1yESFSuQCqACpMrEggnly8-EII0gpS0pbiypaaoowK8Qq6Bkbi0sqSmaJylmXK2payru5omF5EkpC4WDxQxAAiAKIACuQAytSBAPoAYuQASgCykgBUIfwR3HxhMbZmwhZpBcJpqsp6hgjGcowyjJqqyYyMcrJy4jUgHvX4jc1cbZ29A0Njk1MxtQuqQOv1hgBhAASAEFaJQuh0FmEllFVohLIxpJJbLdMZpTiVRAVDhjhIVhKYbqJRMoMmkXG5nnVON4mhAWl9un1BiNxtMgSCwZDYfDEfRLKF2K9ltEyQoZHYCjS6flRApSQhxBoZJcNMlxHZNNkni9We8OZ92rQugB1YaWCHggCK-nIgS6yOlnFl6IQmgDkmECnSNzkBIc4lEmuMpnMVhsdkUjksjNqETZH1aUEkOAATvpAugJnAcOg82B+jgAIY4MDEL3hGVo0AxO6FNXCOzCB7SXbSGNVSRyWm7YTCMoORzVJlmhpYdmcnP5wvF0vlys1usNyWLZsrVsYqqFEfj9IPTSmOSD7Ej5Rjicpxzj00s+eLq2SLAQAA29f6-gAEJTEMjaogeggYgo2jDiY+LPsoxLRrkxwhuYuxJJYDzjuISRdq+GYWkuX6-v+QEgcEu4ovucoII4pySKm5LWJiZQSOImrWHIw6YnExrJLIGTSARryZpa2YkX+xAAcBoHKFKTY+i2kF0WoZh6thjA2FhNKaqIjiMQGKjqgGfbyI8s5vm8C5Zm0klkbJwSiAp4G0c+CqYow5JZModyXJqmyWEUcjBpYEhlHE0hyCJ5o2eJdnflJMkUfQCguTRfrTgq2QpKkXbQZcA4ofIZw9goNyGkolTKDF762TmiUOSlwjpUpEExPRZhbPpqbGoo0hFUcIWaMOWT5ANYUZNFlmEXFxGNdJ5GgeIrUtMpHVqAqeyUoJkbjpxGjCEUmipKmBS3MS03pqJRGfgtyWgdIq2RO1UEMeImgaCF45cZxKRHQSjjZIJn0DbV1kfhJqAVqg1Z5rWyzEBAvBgF+PAAG7oAA1qjc4Q-VkjQ2gcMI7wCCtJjADGpM8CEYEZYesQSJIo7apexKYrSmq4dx9xdgSlKnIwljg2JxFE7D8MvcQYB5nm5aEz+tYAGblgAtpIeNi5+Esky95MY+g1MvXTLB7m1tEBkd2SUhzGjqgcxVYYqDxYlhWImKIouNLABAAEZq7gVq0GAcOBAISMo2jmM45rVkh3DJbK-TFt+ohQ4hrIk4hV5qYxqUkgEnIii3Eadght7C6+wHQfZl0ABqUzh5HPCoxT2O41ZDdTEnKdra9CDp9ime4fRmwTjkQ0jcXnP6eVIYe5XkjV4HOBWv06BKzw1bN8jrfRx3ccRBvW-Vr3ZvUanjND4xXbqrsHvEpqthBdIDIqFpqQ5UvK+120gQEDzH7dAu8o7t1jnjABQC1zJwvt6futEb4j2zuPPOKF4gUhwpeXyxoqjGh-v7VeVp65YDzDgAg1YfwQgABbVlaKA-e4DO4RBIWQihVDaGtHPs9X019QxFHdj2VIPVuYOEkOIYMtJZDQWDA8AhNc17ZiLDwBhbdDYQKsso7h5sEFp30sPYko8lCoMnogD+hckhRTuIkT6qR5FEOzFWMAP4lZ5lUQfDRx86wuMTmAWBPD1qICQYYlBudTH+k0FILs2lTi7EvFUexf8oCBHlioiOe81Ex2Ya8FJvBtGX10XwjOhj0iOAkWgo4EVsS5ziKUG4GQkiuCZDwdAKB4BhC1kQHRL03JBVxHUgkX1iSqBjJkPpFxbDyF8tkMpS96rdN4SpXYOJtQDMJCOAoGoUJ4F4kGFQuxoIKBSF5RCcz4rLgLEWEssAywVirLWMACzAkIGglIEKI5SlWPuDGOk5gVCrLwtORwXsZo3TmndUiTyB6TSkPkCc2Q7COHvFso4dgziqAnqobI+jNBnPFjDPWizXJ+lOEFC4wZyq7FELgwaGIPpBiqISbUXkhI1VBbFZehCkkJzcTEeBPTMoPAVG7e8wtAYVFGRsf5vUkjJEvLi9l75f6KLaN3cOUK3LYRxGdbQWICgDWQpU3yOJ2zaCnB9RCILrocuVevTe1Zt7qoKQKxmWFyR-PkD2dUtwzJ6TCuI6RFgJq4UpIklVyTAHAKdfyxZHV3lBgnIkLCSQ0gopEDcQuuEAzyBHNqQ0YbiGkPIZQmhdC0kasFeVIMAtkgqD1OE-IpVtRdjCn2axFlrVKq5eG5R0bFKFJUlhRIOJgxv2pXfckHEULDRZohXOGR9JRg7cyWanKFHr28a4vtxLXUhQVOGClGFTLaAOuqTNihCT6UtWyztENbVKNSduhmg72w4kiX2NQbF7yGoxP9IolIGQ7EyAq1wQA */
  id: "deposit-ui",

  context: ({ input, spawn, self }) => {
    return {
      tokenList: input.tokenList,
      userAddress: null,
      userWalletAddress: null,
      userChainType: null,
      preparationOutput: null,
      depositOutput: null,
      poaBridgeInfoRef: spawn("poaBridgeInfoActor", {
        id: "poaBridgeInfoRef",
      }),
      depositFormRef: spawn("depositFormActor", {
        id: "depositFormRef",
        input: { parentRef: self, token: input.token, is1cs: input.is1cs },
      }),
      depositGenerateAddressRef: spawn("depositGenerateAddressActor", {
        id: "depositGenerateAddressRef",
        input: { parentRef: self },
      }),
      storageDepositAmountRef: spawn("storageDepositAmountActor", {
        id: "storageDepositAmountRef",
        input: { parentRef: self },
      }),
      depositTokenBalanceRef: spawn("depositTokenBalanceActor", {
        id: "depositTokenBalanceRef",
        input: { parentRef: self },
      }),
      depositEstimationRef: spawn("depositEstimationActor", {
        id: "depositEstimationRef",
        input: { parentRef: self },
      }),
      intentRefs: [],
      is1cs: input.is1cs,
    }
  },

  entry: ["fetchPOABridgeInfo"],

  on: {
    LOGIN: {
      actions: [
        assign({
          userAddress: ({ event }) => event.params.userAddress,
          userWalletAddress: ({ event }) => event.params.userWalletAddress,
          userChainType: ({ event }) => event.params.userChainType,
        }),
      ],
      target: ".editing.tryToRestoreState",
      reenter: true,
    },

    LOGOUT: {
      actions: [
        "clearResults",
        "resetPreparationOutput",
        assign({
          userAddress: () => "",
          userWalletAddress: () => "",
          userChainType: () => null,
        }),
        "requestClearAddress",
      ],
    },
  },

  states: {
    editing: {
      initial: "idle",

      on: {
        "DEPOSIT_FORM.*": {
          target: "editing",
          actions: [
            {
              type: "relayToDepositFormRef",
              params: ({ event }) => event,
            },
          ],
        },
        DEPOSIT_FORM_FIELDS_CHANGED: [
          {
            target: ".preparation",
            guard: "isDepositParamsComplete",
            actions: [
              {
                type: "refreshBalanceIfNeeded",
                params: ({ event }) => event,
              },
              "resetPreparationOutput",
            ],
          },
          {
            target: ".idle",
            actions: [
              {
                type: "refreshBalanceIfNeeded",
                params: ({ event }) => event,
              },
              "resetPreparationOutput",
            ],
          },
        ],
      },

      states: {
        tryToRestoreState: {
          always: [
            {
              target: "preparation",
              guard: "isDepositParamsComplete",
            },
            {
              target: "idle",
            },
          ],
        },
        idle: {
          on: {
            SUBMIT: [
              {
                target: "#deposit-ui.submittingNearTx",
                guard: "isChainNearSelected",
                actions: "clearResults",
                reenter: true,
              },
              {
                target: "#deposit-ui.submittingEVMTx",
                guard: "isChainEVMSelected",
                actions: "clearResults",
                reenter: true,
              },
              {
                target: "#deposit-ui.submittingSolanaTx",
                guard: "isChainSolanaSelected",
                actions: "clearResults",
                reenter: true,
              },
              {
                target: "#deposit-ui.submittingTurboTx",
                guard: "isChainAuroraEngineSelected",
                actions: "clearResults",
                reenter: true,
              },
              {
                target: "#deposit-ui.submittingVirtualChainTx",
                guard: "isVirtualChainSelected",
                actions: "clearResults",
                reenter: true,
              },
              {
                target: "#deposit-ui.submittingTonTx",
                guard: "isChainTonSelected",
                actions: "clearResults",
                reenter: true,
              },
              {
                target: "#deposit-ui.submittingStellarTx",
                guard: "isChainStellarSelected",
                actions: "clearResults",
                reenter: true,
              },
              {
                target: "#deposit-ui.submittingTronTx",
                guard: "isChainTronSelected",
                actions: "clearResults",
                reenter: true,
              },
            ],
          },
        },

        preparation: {
          entry: [
            "requestGenerateAddress",
            "requestBalanceRefresh",
            "requestStorageDepositAmount",
          ],
          invoke: {
            src: "prepareDepositActor",
            input: ({ context }) => {
              assert(context.userAddress, "userAddress is null")
              return {
                userAddress: context.userAddress,
                userWalletAddress: context.userWalletAddress,
                formValues: context.depositFormRef.getSnapshot().context,
                depositGenerateAddressRef: context.depositGenerateAddressRef,
                storageDepositAmountRef: context.storageDepositAmountRef,
                depositTokenBalanceRef: context.depositTokenBalanceRef,
                depositEstimationRef: context.depositEstimationRef,
              }
            },
            onDone: {
              target: "idle",
              actions: {
                type: "setPreparationOutput",
                params: ({ event }) => event.output,
              },
              reenter: true,
            },
            onError: {
              target: "idle",
              actions: [
                {
                  type: "setPreparationOutput",
                  params: ({ event }) => ({
                    tag: "err",
                    value: {
                      reason: "ERR_PREPARING_DEPOSIT",
                      error: event.error,
                    },
                  }),
                },
                {
                  type: "logError",
                  params: ({ event }: { event: unknown }) => event,
                },
              ],
              reenter: true,
            },
          },
        },
      },
    },

    submittingNearTx: {
      invoke: {
        id: "depositNearRef",
        src: "depositNearActor",
        input: ({ context, event }) => {
          assertEvent(event, "SUBMIT")
          const params = extractDepositParams(context)
          assert(
            params.storageDepositRequired !== null,
            "storageDepositRequired is null"
          )
          return {
            ...params,
            type: "depositNear",
            storageDepositRequired: params.storageDepositRequired,
          }
        },
        onDone: {
          target: "editing",
          actions: [
            {
              type: "setDepositOutput",
              params: ({ event }) => event.output,
            },
            {
              type: "spawnIntentStatusActor",
              params: ({ event }) => event.output,
            },
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
          ],
          reenter: true,
        },
        onError: {
          target: "editing",
          actions: [
            {
              type: "logError",
              params: ({ event }: { event: unknown }) => event,
            },
          ],
          reenter: true,
        },
      },
    },
    submittingEVMTx: {
      invoke: {
        id: "depositEVMRef",
        src: "depositEVMActor",
        input: ({ context, event }) => {
          assertEvent(event, "SUBMIT")
          const params = extractDepositParams(context)
          assert(params.depositAddress, "depositAddress is null")
          return {
            ...params,
            type: "depositEVM",
            depositAddress: params.depositAddress,
          }
        },
        onDone: {
          target: "editing",
          actions: [
            {
              type: "setDepositOutput",
              params: ({ event }) => event.output,
            },
            {
              type: "spawnIntentStatusActor",
              params: ({ event }) => event.output,
            },
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
          ],
          reenter: true,
        },
        onError: {
          target: "editing",
          actions: [
            {
              type: "logError",
              params: ({ event }: { event: unknown }) => event,
            },
          ],
          reenter: true,
        },
      },
    },
    submittingSolanaTx: {
      invoke: {
        id: "depositSolanaRef",
        src: "depositSolanaActor",
        input: ({ context, event }) => {
          assertEvent(event, "SUBMIT")
          const params = extractDepositParams(context)
          assert(params.depositAddress, "depositAddress is null")
          return {
            ...params,
            type: "depositSolana",
            depositAddress: params.depositAddress,
          }
        },
        onDone: {
          target: "editing",
          actions: [
            {
              type: "setDepositOutput",
              params: ({ event }) => event.output,
            },
            {
              type: "spawnIntentStatusActor",
              params: ({ event }) => event.output,
            },
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
            "clearSolanaATACache",
          ],
          reenter: true,
        },
        onError: {
          target: "editing",
          actions: [
            {
              type: "logError",
              params: ({ event }: { event: unknown }) => event,
            },
          ],
          reenter: true,
        },
      },
    },
    submittingTurboTx: {
      invoke: {
        id: "depositTurboRef",
        src: "depositTurboActor",
        input: ({ context, event }) => {
          assertEvent(event, "SUBMIT")
          const params = extractDepositParams(context)
          return {
            ...params,
            type: "depositTurbo",
            depositAddress: config.env.contractID,
          }
        },
        onDone: {
          target: "editing",
          actions: [
            {
              type: "setDepositOutput",
              params: ({ event }) => event.output,
            },
            {
              type: "spawnIntentStatusActor",
              params: ({ event }) => event.output,
            },
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
          ],
          reenter: true,
        },
        onError: {
          target: "editing",
          actions: [
            {
              type: "logError",
              params: ({ event }: { event: unknown }) => event,
            },
          ],
          reenter: true,
        },
      },
    },
    submittingVirtualChainTx: {
      invoke: {
        id: "depositVirtualChainRef",
        src: "depositVirtualChainActor",
        input: ({ context, event }) => {
          assertEvent(event, "SUBMIT")
          const params = extractDepositParams(context)
          return {
            ...params,
            type: "depositVirtualChain",
            depositAddress: config.env.contractID,
          }
        },
        onDone: {
          target: "editing",
          actions: [
            {
              type: "setDepositOutput",
              params: ({ event }) => event.output,
            },
            {
              type: "spawnIntentStatusActor",
              params: ({ event }) => event.output,
            },
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
          ],
          reenter: true,
        },
        onError: {
          target: "editing",
          actions: [
            {
              type: "logError",
              params: ({ event }: { event: unknown }) => event,
            },
          ],
          reenter: true,
        },
      },
    },
    submittingTonTx: {
      invoke: {
        id: "depositTonRef",
        src: "depositTonActor",
        input: ({ context, event }) => {
          assertEvent(event, "SUBMIT")
          const params = extractDepositParams(context)
          assert(params.depositAddress, "depositAddress is null")
          return {
            ...params,
            type: "depositTon",
            depositAddress: params.depositAddress,
          }
        },
        onDone: {
          target: "editing",
          actions: [
            {
              type: "setDepositOutput",
              params: ({ event }) => event.output,
            },
            {
              type: "spawnIntentStatusActor",
              params: ({ event }) => event.output,
            },
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
          ],
          reenter: true,
        },
        onError: {
          target: "editing",
          actions: [
            {
              type: "logError",
              params: ({ event }: { event: unknown }) => event,
            },
          ],
          reenter: true,
        },
      },
    },
    submittingStellarTx: {
      invoke: {
        id: "depositStellarRef",
        src: "depositStellarActor",
        input: ({ context, event }) => {
          assertEvent(event, "SUBMIT")
          const params = extractDepositParams(context)
          assert(params.depositAddress, "depositAddress is null")
          return {
            ...params,
            type: "depositStellar",
            depositAddress: params.depositAddress,
            memo: params.memo,
          }
        },
        onDone: {
          target: "editing",
          actions: [
            {
              type: "setDepositOutput",
              params: ({ event }) => event.output,
            },
            {
              type: "spawnIntentStatusActor",
              params: ({ event }) => event.output,
            },
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
          ],
          reenter: true,
        },
        onError: {
          target: "editing",
          actions: [
            {
              type: "logError",
              params: ({ event }: { event: unknown }) => event,
            },
          ],
          reenter: true,
        },
      },
    },
    submittingTronTx: {
      invoke: {
        id: "depositTronRef",
        src: "depositTronActor",
        input: ({ context, event }) => {
          assertEvent(event, "SUBMIT")
          const params = extractDepositParams(context)
          assert(params.depositAddress, "depositAddress is null")
          return {
            ...params,
            type: "depositTron",
            depositAddress: params.depositAddress,
          }
        },
        onDone: {
          target: "editing",
          actions: [
            {
              type: "setDepositOutput",
              params: ({ event }) => event.output,
            },
            {
              type: "spawnIntentStatusActor",
              params: ({ event }) => event.output,
            },
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
          ],
          reenter: true,
        },
        onError: {
          target: "editing",
          actions: [
            {
              type: "logError",
              params: ({ event }: { event: unknown }) => event,
            },
          ],
          reenter: true,
        },
      },
    },
  },

  initial: "editing",
})

type DepositParams = {
  chainName: SupportedChainName
  derivedToken: BaseTokenInfo
  tokenDeployment: TokenDeployment
  balance: bigint
  amount: bigint
  nearBalance: bigint | null
  userAddress: string
  userWalletAddress: string | null
  depositAddress: string | null
  storageDepositRequired: bigint | null
  solanaATACreationRequired: boolean
  tonJettonWalletCreationRequired: boolean
  memo: string | null
  depositMode: DepositMode
}

function extractDepositParams(context: Context): DepositParams {
  const { value: prepOutput } =
    context.preparationOutput?.tag === "ok"
      ? context.preparationOutput
      : { value: null }

  const {
    token,
    derivedToken,
    tokenDeployment,
    blockchain,
    parsedAmount,
    depositMode,
  } = context.depositFormRef.getSnapshot().context

  // Validate all required fields
  assert(token, "token is null")
  assert(derivedToken, "derivedToken is null")
  assert(tokenDeployment, "tokenDeployment is null")
  assert(blockchain !== null, "blockchain is null")
  assert(context.userAddress, "userAddress is null")
  assert(context.userWalletAddress, "userWalletAddress is null")
  assert(parsedAmount, "parsed amount is null")
  assert(prepOutput?.balance, "balance is null")

  return {
    chainName: blockchain,
    derivedToken,
    tokenDeployment,
    balance: prepOutput.balance,
    nearBalance: prepOutput.nearBalance,
    amount: parsedAmount,
    userAddress: context.userAddress,
    userWalletAddress: context.userWalletAddress,
    depositAddress: prepOutput.generateDepositAddress,
    storageDepositRequired: prepOutput.storageDepositRequired,
    solanaATACreationRequired: prepOutput.solanaATACreationRequired,
    tonJettonWalletCreationRequired: prepOutput.tonJettonWalletCreationRequired,
    memo: prepOutput.memo,
    depositMode,
  }
}

// biome-ignore lint/correctness/noUnusedVariables: TODO: use this in preparation 1cs quote
const isNetworkRequiresMemo = (chainName: SupportedChainName): boolean =>
  ["stellar"].includes(chainName) // "ton" requires memo but for some reason it works without it
