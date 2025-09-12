import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { assert } from "@src/components/DefuseSDK/utils/assert"
import {
  type ActorRefFrom,
  and,
  assertEvent,
  assign,
  enqueueActions,
  sendTo,
  setup,
} from "xstate"
import { config } from "../../config"
import { clearSolanaATACache } from "../../services/depositService"
import type { BaseTokenInfo, SupportedChainName } from "../../types/base"
import type { SwappableToken } from "../../types/swap"
import { depositEstimationMachine } from "./depositEstimationActor"
import {
  type Events as DepositFormEvents,
  type ParentEvents as DepositFormParentEvents,
  type Fields,
  depositFormReducer,
} from "./depositFormReducer"
import { depositGenerateAddressMachine } from "./depositGenerateAddressMachine"
import { type Output as DepositOutput, depositMachine } from "./depositMachine"
import { depositTokenBalanceMachine } from "./depositTokenBalanceMachine"
import { poaBridgeInfoActor } from "./poaBridgeInfoActor"
import {
  type PreparationOutput,
  prepareDepositActor,
} from "./prepareDepositActor"
import { storageDepositAmountMachine } from "./storageDepositAmountMachine"

export type Context = {
  depositGenerateAddressRef: ActorRefFrom<typeof depositGenerateAddressMachine>
  poaBridgeInfoRef: ActorRefFrom<typeof poaBridgeInfoActor>
  tokenList: SwappableToken[]
  userAddress: string | null
  userWalletAddress: string | null
  userChainType: AuthMethod | null
  depositFormRef: ActorRefFrom<typeof depositFormReducer>
  preparationOutput: PreparationOutput | null
  storageDepositAmountRef: ActorRefFrom<typeof storageDepositAmountMachine>
  depositTokenBalanceRef: ActorRefFrom<typeof depositTokenBalanceMachine>
  depositEstimationRef: ActorRefFrom<typeof depositEstimationMachine>
  depositOutput: DepositOutput | null
}

export const depositUIMachine = setup({
  types: {
    input: {} as {
      tokenList: SwappableToken[]
      token: SwappableToken
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
      | DepositFormParentEvents,
    children: {} as {
      depositNearRef: "depositNearActor"
      depositEVMRef: "depositEVMActor"
      depositSolanaRef: "depositSolanaActor"
      depositTurboRef: "depositTurboActor"
      depositVirtualChainRef: "depositVirtualChainActor"
      depositTonRef: "depositTonActor"
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
  },
  actions: {
    setDepositOutput: assign({
      depositOutput: (_, value: DepositOutput) => value,
    }),
    setPreparationOutput: assign({
      preparationOutput: (_, val: Context["preparationOutput"]) => val,
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
      const { derivedToken } = context.depositFormRef.getSnapshot().context
      const depositAddress =
        context.preparationOutput?.tag === "ok"
          ? context.preparationOutput.value.generateDepositAddress
          : null

      if (derivedToken != null && depositAddress != null) {
        clearSolanaATACache(derivedToken, depositAddress)
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
        return {
          type: "REQUEST_GENERATE_ADDRESS",
          params: {
            userAddress: context.userAddress,
            blockchain: context.depositFormRef.getSnapshot().context.blockchain,
            userChainType: context.userChainType,
          },
        }
      }
    ),
    requestClearAddress: sendTo("depositGenerateAddressRef", () => ({
      type: "REQUEST_CLEAR_ADDRESS",
    })),
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
    requestBalanceRefresh: sendTo("depositTokenBalanceRef", ({ context }) => {
      return {
        type: "REQUEST_BALANCE_REFRESH",
        params: {
          derivedToken:
            context.depositFormRef.getSnapshot().context.derivedToken,
          userAddress: context.userAddress,
          userWalletAddress: context.userWalletAddress,
          blockchain: context.depositFormRef.getSnapshot().context.blockchain,
        },
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
  /** @xstate-layout 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 */
  id: "deposit-ui",

  context: ({ input, spawn, self }) => ({
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
      input: { parentRef: self, token: input.token },
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
  }),

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
      target: ".editing",
      reenter: true,
    },

    LOGOUT: {
      actions: [
        "clearResults",
        "resetPreparationOutput",
        assign({
          userAddress: () => "",
          userWalletAddress: () => "",
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
          entry: ["requestGenerateAddress", "requestStorageDepositAmount"],
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

            onError: {
              target: "idle",
              actions: {
                type: "setPreparationOutput",
                params: ({ event }) => ({
                  tag: "err",
                  value: {
                    reason: "ERR_PREPARING_DEPOSIT",
                    error: event.error,
                  },
                }),
              },
              reenter: true,
            },

            onDone: {
              target: "idle",
              actions: {
                type: "setPreparationOutput",
                params: ({ event }) => event.output,
              },
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
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
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
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
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
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
            { type: "clearSolanaATACache" },
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
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
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
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
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
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
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
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
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
            "clearUIDepositAmount",
            "requestBalanceRefresh",
            "resetPreparationOutput",
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
}

function extractDepositParams(context: Context): DepositParams {
  const { value: prepOutput } =
    context.preparationOutput?.tag === "ok"
      ? context.preparationOutput
      : { value: null }

  const { token, derivedToken, blockchain, parsedAmount } =
    context.depositFormRef.getSnapshot().context

  // Validate all required fields
  assert(token, "token is null")
  assert(derivedToken, "derivedToken is null")
  assert(blockchain !== null, "blockchain is null")
  assert(context.userAddress, "userAddress is null")
  assert(context.userWalletAddress, "userWalletAddress is null")
  assert(parsedAmount, "parsed amount is null")
  assert(prepOutput?.balance, "balance is null")

  return {
    chainName: blockchain,
    derivedToken,
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
  }
}
