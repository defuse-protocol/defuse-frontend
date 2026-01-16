import { authIdentity } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { nearClient } from "@src/components/DefuseSDK/constants/nearClient"
import { logger } from "@src/utils/logger"
import { type QueryClient, QueryObserver } from "@tanstack/query-core"
import {
  type ActorRef,
  type Snapshot,
  type SnapshotFrom,
  assertEvent,
  assign,
  enqueueActions,
  fromCallback,
  sendTo,
  setup,
} from "xstate"
import { queryClient } from "../../providers/QueryClientProvider"
import { invalidateBalanceQueries } from "../../queries/balanceQueries"
import { getDepositedBalances } from "../../services/defuseBalanceService"
import { getTransitBalance } from "../../services/getTransitBalance"
import type { BaseTokenInfo, TokenInfo, TokenValue } from "../../types/base"
import type { IntentsUserId } from "../../types/intentsUserId"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
} from "../../utils/tokenUtils"

export interface Input {
  parentRef?: ParentActor
  tokenList: TokenInfo[]
}

export type BalanceMapping = Record<BaseTokenInfo["defuseAssetId"], bigint>

type ParentReceivedEvents = {
  type: "BALANCE_CHANGED"
  params: {
    changedBalanceMapping: BalanceMapping
    changedTransitBalanceMapping: BalanceMapping
  }
}
type ParentActor = ActorRef<Snapshot<unknown>, ParentReceivedEvents>

type SharedEvents = {
  type: "UPDATE_BALANCE_SLICE"
  params: {
    balanceSlice: BalanceMapping
    transitBalanceSlice: BalanceMapping
  }
}
type ThisActor = ActorRef<Snapshot<unknown>, SharedEvents>

export type Events =
  | { type: "LOGOUT" | "REQUEST_BALANCE_REFRESH" }
  | {
      type: "LOGIN"
      params: { userAddress: string; userChainType: AuthMethod }
    }
  | {
      type: "ADD_ACCOUNT"
      params: { accountId: IntentsUserId }
    }
  | {
      type: "REMOVE_ACCOUNT"
      params: { accountId: IntentsUserId }
    }

const balancePollerActor = fromCallback<
  | {
      type: "ADD_ACCOUNT" | "REMOVE_ACCOUNT"
      params: { accountId: IntentsUserId }
    }
  | {
      type: "REFETCH"
    },
  {
    tokenIds: string[]
    accountId: IntentsUserId
    parentRef: ThisActor
  }
>(({ input, receive }) => {
  const accounts = new Set([input.accountId])

  receive((event) => {
    switch (event.type) {
      case "ADD_ACCOUNT":
        logger.trace("Add account to balance polling actor", {
          accountId: event.params.accountId,
        })
        accounts.add(event.params.accountId)
        break
      case "REMOVE_ACCOUNT":
        logger.trace("Remove account from balance polling actor", {
          accountId: event.params.accountId,
        })
        accounts.delete(event.params.accountId)
        break
      case "REFETCH":
        restartInterval()
        break
    }
  })

  async function fetchBalanceAndEmit() {
    try {
      const status = await nearClient.status()
      const blockHeight = status.sync_info.latest_block_height

      const balances = await Promise.all(
        Array.from(accounts).map((accountId) => {
          return getDepositedBalances(
            accountId,
            input.tokenIds,
            nearClient,
            blockHeight
          )
        })
      )

      const mergedBalance = mergeBalance(balances)

      input.parentRef.send({
        type: "UPDATE_BALANCE_SLICE",
        params: {
          balanceSlice: mergedBalance,
          transitBalanceSlice: {},
        },
      })
    } catch (err: unknown) {
      logger.error(err)
    }
  }

  function dispose() {
    if (timer != null) {
      clearInterval(timer)
    }
  }

  let timer: ReturnType<typeof setInterval> | null = null
  function restartInterval() {
    dispose()
    void fetchBalanceAndEmit()
    timer = setInterval(() => {
      void fetchBalanceAndEmit()
    }, 10000)
  }

  restartInterval()

  return () => {
    dispose()
  }
})

export const depositedBalanceMachine = setup({
  types: {
    context: {} as {
      parentRef: ParentActor | undefined
      accountId: IntentsUserId | null
      tokenIds: string[]
      balances: BalanceMapping
      transitBalances: BalanceMapping
      transitBalanceQueryObserver: TransitBalanceQueryObserver
    },
    events: {} as Events | SharedEvents,
    input: {} as Input,
  },
  actors: {
    balancePollerActor: balancePollerActor,
    getTransitBalances: fromCallback(
      ({
        input,
      }: {
        input: { observer: TransitBalanceQueryObserver; parentRef: ThisActor }
      }) => {
        return input.observer.subscribe((result) => {
          if (result.isSuccess) {
            input.parentRef.send({
              type: "UPDATE_BALANCE_SLICE",
              params: {
                balanceSlice: {},
                transitBalanceSlice: result.data,
              },
            })
          }
        })
      }
    ),
  },
  actions: {
    updateTransitBalanceQueryObserver: (
      { context },
      user: IntentsUserId | null
    ) => {
      const queryKey = structuredClone(
        context.transitBalanceQueryObserver.options.queryKey
      )
      queryKey[1].user = user

      context.transitBalanceQueryObserver.setOptions({
        ...context.transitBalanceQueryObserver.options,
        queryKey: queryKey,
        queryHash: undefined,
      })
    },
    updateBalance: enqueueActions(
      (
        { enqueue, context },
        params: {
          balanceSlice: BalanceMapping
          transitBalanceSlice: BalanceMapping
        }
      ) => {
        const balanceChanged: BalanceMapping = {}
        const transitBalanceChanged: BalanceMapping = {}

        for (const [key, val] of Object.entries(params.balanceSlice)) {
          if (context.balances[key] !== val) {
            balanceChanged[key] = val
          }
        }

        for (const [key, val] of Object.entries(params.transitBalanceSlice)) {
          if (context.transitBalances[key] !== val) {
            transitBalanceChanged[key] = val
          }
        }

        if (
          Object.keys(balanceChanged).length > 0 ||
          Object.keys(transitBalanceChanged).length > 0
        ) {
          // First update the local state
          enqueue.assign({
            balances: () => ({ ...context.balances, ...balanceChanged }),
            transitBalances: transitBalanceChanged,
          })
          // Then send the event to the parent
          enqueue(({ context }) => {
            context.parentRef?.send({
              type: "BALANCE_CHANGED",
              params: {
                changedBalanceMapping: balanceChanged,
                changedTransitBalanceMapping: transitBalanceChanged,
              },
            })
          })
        }
      }
    ),
    clearBalance: assign({
      balances: {},
      transitBalances: {},
    }),
    refetch: sendTo("balancePollerRef", {
      type: "REFETCH",
    }),
    addAccount: sendTo(
      "balancePollerRef",
      (_, params: { accountId: IntentsUserId }) => {
        return {
          type: "ADD_ACCOUNT",
          params,
        }
      }
    ),
    removeAccount: sendTo(
      "balancePollerRef",
      (_, params: { accountId: IntentsUserId }) => {
        return {
          type: "REMOVE_ACCOUNT",
          params,
        }
      }
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QTABwPawJYBdICEBDAG0IDsBjMAYgBkB5AcQEkA5AbQAYBdRUDbDizoyfEAA9EAWgCMAZk4A6AOwBOAKwyALJ1UA2ZXLnqANCACe0mQA45ivda2G9WgExyt15VoC+PsygCuAQk5FSKhACuOAAWYGRCFIR4EHRM9ACqACpcvEggQUIiYpIIssaKqsq6Mhqunpw2ymaWZR4qWnWOnHKunH3WfgFomMEQRKSUYBHRcQlYSSnUAEoAogCKGasAylkA+vgAgrSHrADCq3trAGJr2wASuWKFwqL5pTKainK2ejI2tXUyiBrhaVj0dh+7lc6nqnGsek4vn8IECoxSEzC0yisXiiWSkEUACcwAAzEmwGJYMhQAAEACNQlNqBARNNqQA3dAAa2mpLAOAoMUxU2WZKe+RexXeiH+qkU6ms1iRCmqcj0MK0YIQf0UjS06us6gN3j0qkGKLRghCk3COLm+JSxLJFKpNIZTKo1AyAAUACKHLKXI4nc6Xba0ZgXCX8dGvEqIWEyFSfGR-VxqWFG7VSAyKBEyJHKQvGLTqPRDVEja3jT3Y2Z4hYEiCKLAQYg0cSwHAEiKkvBEgAU6k4o4AlCzq2MRXaG-NFoS2x2YwU49LQKUPMmtNoNRDNY5QRZELr9YbjXJTea-CiyOgUPB8lbp3Xnmu3hvpD8lOpVB4EUq1R6C4OZGNY3zWO4qZKoWqiuBWlpThidaKJEZD2o2C4QG+gjxjKbS9Aqf6eA4XicMBWrHggSgaD0Zb6B4nDeEaFrDIUNpYjMuLzs2OG4Hhn46nYGh6OomguMoaiuNoOYwkoSrQv02ieJ4riVs+yG2vW3GOoSJLknAbp0oyWl8UUH4SLK-yVOWYlpk4UkyVRubgUqciAvBMIaloyJseiHFTFxDpNk6S5gGZAmWQgrjWMmnC-jFiJKgaRiUa08h2BCqiqJ0kHGuoqo3j4QA */
  id: "depositedBalance",

  initial: "unauthenticated",

  context: ({ input }) => {
    const tokenIds = input.tokenList
      .flatMap((t) => getUnderlyingBaseTokenInfos(t))
      .map((t) => t.defuseAssetId)

    return {
      tokenIds,
      depositedBalanceQueryObserver: createDepositedBalanceQueryObserver(
        queryClient,
        tokenIds
      ),
      transitBalanceQueryObserver:
        createTransitBalanceQueryObserver(queryClient),
      balances: {},
      transitBalances: {},
      parentRef: input.parentRef,
      accountId: null,
    }
  },

  states: {
    unauthenticated: {},

    authenticated: {
      invoke: [
        {
          id: "balancePollerRef",
          src: "balancePollerActor",
          input: ({ self, context, event }) => {
            assertEvent(event, "LOGIN")

            return {
              accountId: authIdentity.authHandleToIntentsUserId(
                event.params.userAddress,
                event.params.userChainType
              ),
              tokenIds: context.tokenIds,
              parentRef: self,
            }
          },
        },
        {
          src: "getTransitBalances",
          input: ({ self, context }) => ({
            parentRef: self,
            observer: context.transitBalanceQueryObserver,
          }),
        },
      ],

      on: {
        LOGOUT: {
          target: "unauthenticated",
          actions: [
            assign({ accountId: null }),
            "clearBalance",
            { type: "updateTransitBalanceQueryObserver", params: null },
          ],
        },

        REQUEST_BALANCE_REFRESH: {
          actions: ["refetch", invalidateBalanceQueries],
        },

        UPDATE_BALANCE_SLICE: {
          actions: {
            type: "updateBalance",
            params: ({ event }) => ({
              balanceSlice: event.params.balanceSlice,
              transitBalanceSlice: event.params.transitBalanceSlice,
            }),
          },
        },

        ADD_ACCOUNT: {
          actions: [
            {
              type: "addAccount",
              params: ({ event }) => event.params,
            },
            "refetch",
          ],
        },

        REMOVE_ACCOUNT: {
          actions: {
            type: "removeAccount",
            params: ({ event }) => event.params,
          },
        },
      },
    },
  },

  on: {
    LOGIN: {
      // Ensure it's different user
      guard: ({ event, context }) => {
        const accountId = authIdentity.authHandleToIntentsUserId(
          event.params.userAddress,
          event.params.userChainType
        )
        return context.accountId !== accountId
      },
      target: ".authenticated",
      actions: [
        assign({
          accountId: ({ event }) =>
            authIdentity.authHandleToIntentsUserId(
              event.params.userAddress,
              event.params.userChainType
            ),
        }),
        "clearBalance",
        {
          type: "updateTransitBalanceQueryObserver",
          params: ({ event }) =>
            authIdentity.authHandleToIntentsUserId(
              event.params.userAddress,
              event.params.userChainType
            ),
        },
      ],
      reenter: true,
    },
  },
})

type BalancesSelectorReturn<T> = T extends undefined
  ? undefined
  : BalanceMapping

export function balancesSelector<
  T extends SnapshotFrom<typeof depositedBalanceMachine> | undefined,
>(state: T): BalancesSelectorReturn<T> {
  if (state === undefined) {
    return undefined as BalancesSelectorReturn<T>
  }
  return state.context.balances as BalancesSelectorReturn<T>
}

export function balanceSelector(token: TokenInfo | null | undefined) {
  return (state: undefined | SnapshotFrom<typeof depositedBalanceMachine>) => {
    if (!state || !token) return
    return computeTotalBalanceDifferentDecimals(token, state.context.balances)
  }
}

/**
 * Usage:
 * ```tsx
 * const { tokenInBalance, tokenOutBalance } = useSelector(
 *   depositedBalanceRef,
 *   balanceAllSelector({
 *     tokenInBalance: formValues.tokenIn,
 *     tokenOutBalance: formValues.tokenOut,
 *   })
 * )
 *
 * const [tokenInBalance, tokenOutBalance] = useSelector(
 *   depositedBalanceRef,
 *   balanceAllSelector([formValues.tokenIn, formValues.tokenOut])
 * )
 * ```
 */
export function balanceAllSelector<
  const T extends
    | Record<PropertyKey, TokenInfo | null>
    | Array<TokenInfo | null>,
>(arg: T) {
  return <S extends undefined | SnapshotFrom<typeof depositedBalanceMachine>>(
    state: S
  ): S extends undefined
    ? undefined
    : S extends SnapshotFrom<typeof depositedBalanceMachine>
      ? { [K in keyof T]: TokenValue | undefined }
      : undefined => {
    // @ts-expect-error Need TS wizard to help with this
    if (!state) return

    if (Array.isArray(arg)) {
      const result = arg.map((token) => {
        if (token == null) return

        return computeTotalBalanceDifferentDecimals(
          token,
          state.context.balances
        )
      })
      // @ts-expect-error Need TS wizard to help with this
      return result
    }

    const result = Object.fromEntries(
      Object.entries(arg).map(([key, token]) => {
        if (token == null) return [key, undefined]

        return [
          key,
          computeTotalBalanceDifferentDecimals(token, state.context.balances),
        ]
      })
    )
    // @ts-expect-error Need TS wizard to help with this
    return result
  }
}

export function transitBalanceSelector(token: TokenInfo | null | undefined) {
  return (state: undefined | SnapshotFrom<typeof depositedBalanceMachine>) => {
    if (!state || !token) return

    const pending = computeTotalBalanceDifferentDecimals(
      token,
      state.context.transitBalances,
      {
        strict: false,
      }
    )

    if (pending?.amount === 0n) return
    return pending
  }
}

function createDepositedBalanceQueryObserver(
  queryClient: QueryClient,
  tokenIds: string[]
) {
  return new QueryObserver(queryClient, {
    queryKey: ["deposited_balance", { user: null, tokenIds }] as [
      string,
      { user: null | IntentsUserId; tokenIds: string[] },
    ],
    queryFn: ({ queryKey }) => {
      if (queryKey[1].user == null) {
        throw new Error("user is null")
      }

      return getDepositedBalances(
        queryKey[1].user,
        queryKey[1].tokenIds,
        nearClient
      )
    },
    enabled: (query) => query.queryKey[1].user != null,
    refetchInterval: 10000,
  })
}

type TransitBalanceQueryObserver = ReturnType<
  typeof createTransitBalanceQueryObserver
>

function createTransitBalanceQueryObserver(queryClient: QueryClient) {
  return new QueryObserver(queryClient, {
    queryKey: ["transit_balance", { user: null }] as [
      string,
      { user: null | IntentsUserId },
    ],
    queryFn: ({ queryKey }) => {
      if (queryKey[1].user == null) {
        throw new Error("user is null")
      }

      return getTransitBalance(queryKey[1].user)
    },
    enabled: (query) => query.queryKey[1].user != null,
    refetchInterval: 10000,
  })
}

function mergeBalance(balances: BalanceMapping[]): BalanceMapping {
  if (balances.length === 1) {
    return balances[0]
  }

  const mergedBalance: BalanceMapping = {}
  for (const balance of balances) {
    for (const [k, v] of Object.entries(balance)) {
      mergedBalance[k] = (mergedBalance[k] ?? 0n) + v
    }
  }
  return mergedBalance
}
