import type { AuthMethod } from "@defuse-protocol/internal-utils"
import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenValue,
} from "@src/components/DefuseSDK/types/base"
import { logger } from "@src/utils/logger"
import { assertEvent, assign, fromPromise, setup } from "xstate"
import type { DepositMode } from "./depositFormReducer"

// Blockchains that don't support deposit address generation
const UNSUPPORTED_DEPOSIT_BLOCKCHAINS: Set<SupportedChainName> = new Set([
  "turbochain",
  "tuxappchain",
  "vertex",
  "optima",
  "easychain",
  "aurora",
  "aurora_devnet",
])

type DepositGenerateAddressReturnType = {
  generatedDepositAddress: string | null
  memo: string | null
  minAmountIn: string | null
}

type DepositGenerateAddressErrorType = { reason: "ERR_GENERATING_ADDRESS" }

export type PreparationOutput =
  | { tag: "ok"; value: DepositGenerateAddressReturnType }
  | { tag: "err"; value: DepositGenerateAddressErrorType }

export type Context = {
  preparationOutput: PreparationOutput | null
}

export const depositGenerateAddressMachine = setup({
  types: {
    context: {} as Context,
    events: {} as
      | {
          type: "REQUEST_GENERATE_ADDRESS"
          params: {
            userAddress: string
            userChainType: AuthMethod
            blockchain: SupportedChainName
            tokenIn: BaseTokenInfo
            tokenOut: BaseTokenInfo
            amountIn: TokenValue
            depositMode: DepositMode
          }
        }
      | {
          type: "REQUEST_CLEAR_ADDRESS"
        },
  },
  actors: {
    generateDepositAddress: fromPromise(
      async (_: {
        input: {
          userAddress: string
          userChainType: AuthMethod
          blockchain: SupportedChainName
          tokenIn: BaseTokenInfo
          tokenOut: BaseTokenInfo
          amountIn: TokenValue
          depositMode: DepositMode
        }
      }): Promise<{
        generatedDepositAddress: string | null
        memo: string | null
        minAmountIn: string | null
      }> => {
        throw new Error("not implemented")
      }
    ),
  },
  actions: {
    logError: (_, { error }: { error: unknown }) => {
      logger.error(error)
    },
    resetPreparationOutput: assign(() => {
      return {
        preparationOutput: null,
      }
    }),
  },
  guards: {
    isSufficientParams: ({ event }) => {
      assertEvent(event, "REQUEST_GENERATE_ADDRESS")
      if (UNSUPPORTED_DEPOSIT_BLOCKCHAINS.has(event.params.blockchain)) {
        return false
      }
      return (
        event.params.userAddress != null &&
        event.params.userChainType != null &&
        event.params.blockchain != null &&
        event.params.depositMode != null &&
        event.params.tokenIn != null &&
        event.params.tokenOut != null &&
        event.params.amountIn != null
      )
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QTABwPawJYBcDiYAdmAE4CGOYAghBCXLALJkDGAFlsQMQBKAogEUAqnwDKAFQD6ePgDk+PKuL6SqAETX9RogNoAGALqJQGbDizpCxkAE9EAWgAcAdgB0AVgA0IAB6J3AJwAzK7O7s6OAIwATO4AvnHeKKa4BMTklDR0DMzsnGC8giIS0nIKSirqmmK6kUZIICnmltZ+CAHujqHRAQAsAY6OekHuI162iNF6ka4AbJFBjrNBzgHB0b1LCUlomKlEpBTUtPSwTKwcxK4w6RScUFwQlmCunABu6ADWL8l7+AcZY7ZM65S4vG6HcyEKAId7oFh3Sz6AzI6xNCxWBptWaOdweXo9fqLAl6Wa9bx2BDRVahIKLSIBVaBZx6UbbEC-MxpSFA07nPJXCEZe5cUgkdAkVyoAA2FAAZhKALauTn7W6ZE45C75a4Au7Q2GED4I5qEZGohrolpYxA42auaKRPQBaKOIKRdx6XoLCmIEZdT2BXruHGxWIBBKJECEdAoeANVX-dW8rUCsBov4Y1qIXqLVxBYIFxmdAkbX0IeyRZy9VxrNbOHEe93ORbsxPcwFZPmgnVC-VQDNmLM2hCzZzRVx6al05nOMKzALlxmTxnTAm9Ya9HHONu7Ll6jXA-lg1wsdCKmVgSgQQe4YegNrVrpkxwEhkBBfzcvuBauRyMqY5yCVkf0iXcmg7I4u1TE8sAgaV00tTNrQfHMlnzQt6xLaIywmKlYknIICSI5wPVmZYcMjOIgA */
  context: {
    preparationOutput: null,
  },

  id: "depositGenerateAddressMachine",

  on: {
    REQUEST_GENERATE_ADDRESS: [
      {
        actions: ["resetPreparationOutput"],
        target: ".generatingAddress",
        guard: "isSufficientParams",
      },
      {
        actions: {
          type: "logError",
          params: ({ event }) => ({
            error: "Invalid generate deposit address params",
            params: event.params,
          }),
        },
        target: ".idle",
      },
    ],
    REQUEST_CLEAR_ADDRESS: [
      {
        actions: ["resetPreparationOutput"],
        target: ".idle",
      },
    ],
  },

  states: {
    generatingAddress: {
      invoke: {
        src: "generateDepositAddress",
        input: ({ event }) => {
          assertEvent(event, "REQUEST_GENERATE_ADDRESS")
          return event.params
        },
        onDone: {
          target: "completed",
          actions: assign({
            preparationOutput: ({ event }) => ({
              tag: "ok",
              value: event.output,
            }),
          }),

          reenter: true,
        },
        onError: {
          target: "completed",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            assign({
              preparationOutput: () => {
                return {
                  tag: "err",
                  value: {
                    reason: "ERR_GENERATING_ADDRESS",
                  },
                }
              },
            }),
          ],
          reenter: true,
        },
      },
    },

    completed: {},
    idle: {},
  },

  initial: "idle",
})
