import { intentStatusMachine } from "@src/components/DefuseSDK/features/machines/intentStatusMachine"
import { oneClickStatusMachine } from "@src/components/DefuseSDK/features/machines/oneClickStatusMachine"
import type { IntentDescription } from "@src/components/DefuseSDK/features/machines/swapIntentMachine"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { type ActorRefFrom, assign, emit, setup } from "xstate"

type IntentSettledEvent = {
  type: "INTENT_SETTLED"
  data: {
    intentHash: string
    txHash: string
    tokenIn: TokenInfo
    tokenOut: TokenInfo
  }
}

type OneClickSettledEvent = {
  type: "ONE_CLICK_SETTLED"
  data: {
    depositAddress: string
    status: string
    tokenIn: TokenInfo
    tokenOut: TokenInfo
  }
}

type PassthroughEvent = IntentSettledEvent | OneClickSettledEvent

export type TrackedSwapRef = {
  id: string
  intentHash: string
  depositAddress?: string
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  totalAmountIn: { amount: bigint; decimals: number }
  totalAmountOut: { amount: bigint; decimals: number }
  createdAt: Date
  is1cs: boolean
  actorRef:
    | ActorRefFrom<typeof intentStatusMachine>
    | ActorRefFrom<typeof oneClickStatusMachine>
}

export type SwapTrackerContext = {
  swapRefs: TrackedSwapRef[]
}

export type RegisterSwapParams = {
  intentHash: string
  depositAddress?: string
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  intentDescription: IntentDescription
  is1cs: boolean
}

export const swapTrackerMachine = setup({
  types: {
    context: {} as SwapTrackerContext,
    events: {} as
      | { type: "REGISTER_SWAP"; params: RegisterSwapParams }
      | { type: "DISMISS_SWAP"; id: string }
      | PassthroughEvent,
    emitted: {} as PassthroughEvent,
  },
  actors: {
    intentStatusActor: intentStatusMachine,
    oneClickStatusActor: oneClickStatusMachine,
  },
  actions: {
    spawnSwapActor: assign({
      swapRefs: ({ context, event, spawn, self }) => {
        const { params } = event as {
          type: "REGISTER_SWAP"
          params: RegisterSwapParams
        }
        if (params.intentDescription.type !== "swap") return context.swapRefs

        const id = params.depositAddress ?? params.intentHash
        if (context.swapRefs.some((s) => s.id === id)) return context.swapRefs

        const swapDescription = params.intentDescription as Extract<
          IntentDescription,
          { type: "swap" }
        >

        const actorRef =
          params.is1cs && params.depositAddress
            ? spawn("oneClickStatusActor", {
                id: `1cs-${id}`,
                input: {
                  parentRef: self,
                  intentHash: params.intentHash,
                  depositAddress: params.depositAddress,
                  tokenIn: params.tokenIn,
                  tokenOut: params.tokenOut,
                  totalAmountIn: swapDescription.totalAmountIn,
                  totalAmountOut: swapDescription.totalAmountOut,
                },
              })
            : spawn("intentStatusActor", {
                id: `intent-${id}`,
                input: {
                  parentRef: self,
                  intentHash: params.intentHash,
                  tokenIn: params.tokenIn,
                  tokenOut: params.tokenOut,
                  intentDescription: params.intentDescription,
                },
              })

        return [
          {
            id,
            intentHash: params.intentHash,
            depositAddress: params.depositAddress,
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            totalAmountIn: swapDescription.totalAmountIn,
            totalAmountOut: swapDescription.totalAmountOut,
            createdAt: new Date(),
            is1cs: params.is1cs,
            actorRef: actorRef as TrackedSwapRef["actorRef"],
          },
          ...context.swapRefs,
        ]
      },
    }),
    dismissSwapActor: assign({
      swapRefs: ({ context, event }) => {
        const { id } = event as { type: "DISMISS_SWAP"; id: string }
        return context.swapRefs.filter((s) => s.id !== id)
      },
    }),
    passthroughEvent: emit((_, event: PassthroughEvent) => event),
  },
}).createMachine({
  id: "swapTracker",
  context: { swapRefs: [] },
  on: {
    REGISTER_SWAP: { actions: "spawnSwapActor" },
    DISMISS_SWAP: { actions: "dismissSwapActor" },
    INTENT_SETTLED: {
      actions: { type: "passthroughEvent", params: ({ event }) => event },
    },
    ONE_CLICK_SETTLED: {
      actions: { type: "passthroughEvent", params: ({ event }) => event },
    },
  },
})
