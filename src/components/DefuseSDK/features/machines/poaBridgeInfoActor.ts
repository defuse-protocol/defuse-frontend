import { errors, poaBridge } from "@defuse-protocol/internal-utils"
import { logger } from "@src/utils/logger"
import {
  type ActorRefFrom,
  type SnapshotFrom,
  type Values,
  assign,
  fromPromise,
  setup,
  waitFor,
} from "xstate"
import type { BaseTokenInfo } from "../../types/base"

export interface Context {
  bridgeInfo: Record<
    BaseTokenInfo["defuseAssetId"],
    {
      minDeposit: bigint
      minWithdrawal: bigint
      withdrawalFee: bigint
    }
  >
}

export const poaBridgeInfoActor = setup({
  types: {
    context: {} as Context,
  },
  actors: {
    fooActor: fromPromise(async () => {
      return poaBridge.httpClient.getSupportedTokens({})
    }),
  },
  actions: {
    logError: (_, err: Error) => {
      logger.error(err)
    },
    setBridgeInfo: assign({
      bridgeInfo: (
        _,
        bridgeInfo: poaBridge.httpClient.GetSupportedTokensResponse["result"]
      ) => {
        const arr = bridgeInfo.tokens.map(
          (
            bridgedTokenInfo
          ): [keyof Context["bridgeInfo"], Values<Context["bridgeInfo"]>] => {
            return [
              `nep141:${bridgedTokenInfo.near_token_id}`,
              {
                minDeposit: BigInt(bridgedTokenInfo.min_deposit_amount),
                minWithdrawal: BigInt(bridgedTokenInfo.min_withdrawal_amount),
                withdrawalFee: BigInt(bridgedTokenInfo.withdrawal_fee),
              },
            ]
          }
        )

        return Object.fromEntries(arr)
      },
    }),
  },
}).createMachine({
  id: "bridgeInfo",

  context: () => ({
    bridgeInfo: {},
    error: null,
  }),

  initial: "idle",

  states: {
    idle: {
      on: { FETCH: "loading" },
    },
    loading: {
      invoke: {
        src: "fooActor",
        onDone: {
          target: "success",
          actions: {
            type: "setBridgeInfo",
            params: ({ event }) => event.output,
          },
        },
        onError: {
          target: "error",
          actions: {
            type: "logError",
            params: ({ event }) => errors.toError(event.error),
          },
        },
      },
    },
    success: {
      type: "final",
    },
    error: {
      on: { FETCH: "loading" },
    },
  },
})

export const waitPOABridgeInfoActor = fromPromise(
  ({
    input,
    signal,
  }: {
    input: {
      actorRef: ActorRefFrom<typeof poaBridgeInfoActor>
    }
    signal: AbortSignal
  }) => {
    return waitFor(input.actorRef, (state) => state.matches("success"), {
      timeout: 10000,
      signal,
    })
  }
)

export function getPOABridgeInfo(
  state: SnapshotFrom<typeof poaBridgeInfoActor>,
  tokenId: BaseTokenInfo["defuseAssetId"]
): {
  minDeposit: bigint
  minWithdrawal: bigint
  withdrawalFee: bigint
} | null {
  if (!state.matches("success")) return null

  return (
    state.context.bridgeInfo[tokenId] ?? {
      minDeposit: 1n,
      minWithdrawal: 1n,
      withdrawalFee: 0n,
    }
  )
}
