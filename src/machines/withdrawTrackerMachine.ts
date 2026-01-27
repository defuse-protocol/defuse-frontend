import { intentStatusMachine } from "@src/components/DefuseSDK/features/machines/intentStatusMachine"
import type { IntentDescription } from "@src/components/DefuseSDK/features/machines/swapIntentMachine"
import type {
  BaseTokenInfo,
  TokenInfo,
  TokenValue,
} from "@src/components/DefuseSDK/types/base"
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

export type TrackedWithdrawRef = {
  id: string
  intentHash: string
  tokenIn: TokenInfo
  tokenOut: BaseTokenInfo
  amountIn: TokenValue
  amountOut: TokenValue
  recipient: string
  createdAt: Date
  actorRef: ActorRefFrom<typeof intentStatusMachine>
}

export type WithdrawTrackerContext = {
  withdrawRefs: TrackedWithdrawRef[]
}

export type RegisterWithdrawParams = {
  intentHash: string
  tokenIn: TokenInfo
  tokenOut: BaseTokenInfo
  intentDescription: IntentDescription
}

export const withdrawTrackerMachine = setup({
  types: {
    context: {} as WithdrawTrackerContext,
    events: {} as
      | { type: "REGISTER_WITHDRAW"; params: RegisterWithdrawParams }
      | { type: "DISMISS_WITHDRAW"; id: string }
      | IntentSettledEvent,
    emitted: {} as IntentSettledEvent,
  },
  actors: {
    intentStatusActor: intentStatusMachine,
  },
  actions: {
    spawnWithdrawActor: assign({
      withdrawRefs: ({ context, event, spawn, self }) => {
        const { params } = event as {
          type: "REGISTER_WITHDRAW"
          params: RegisterWithdrawParams
        }
        if (params.intentDescription.type !== "withdraw") {
          return context.withdrawRefs
        }

        const id = params.intentHash
        if (context.withdrawRefs.some((w) => w.id === id)) {
          return context.withdrawRefs
        }

        const withdrawDescription = params.intentDescription as Extract<
          IntentDescription,
          { type: "withdraw" }
        >

        const actorRef = spawn("intentStatusActor", {
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
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amountIn: withdrawDescription.amountWithdrawn,
            amountOut: withdrawDescription.amountWithdrawn,
            recipient: withdrawDescription.recipient,
            createdAt: new Date(),
            actorRef,
          },
          ...context.withdrawRefs,
        ]
      },
    }),
    dismissWithdrawActor: assign({
      withdrawRefs: ({ context, event }) => {
        const { id } = event as { type: "DISMISS_WITHDRAW"; id: string }
        return context.withdrawRefs.filter((w) => w.id !== id)
      },
    }),
    passthroughEvent: emit((_, event: IntentSettledEvent) => event),
  },
}).createMachine({
  id: "withdrawTracker",
  context: { withdrawRefs: [] },
  on: {
    REGISTER_WITHDRAW: { actions: "spawnWithdrawActor" },
    DISMISS_WITHDRAW: { actions: "dismissWithdrawActor" },
    INTENT_SETTLED: {
      actions: { type: "passthroughEvent", params: ({ event }) => event },
    },
  },
})
