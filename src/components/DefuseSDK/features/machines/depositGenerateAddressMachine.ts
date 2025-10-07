import type { AuthMethod } from "@defuse-protocol/internal-utils"
import type { SupportedChainName } from "@src/components/DefuseSDK/types/base"
import { assert } from "@src/components/DefuseSDK/utils/assert"
import { assertEvent, assign, fromPromise, setup } from "xstate"
import type { QuoteResult } from "../../services/quoteService"

export type Context = {
  userAddress: string | null
  userChainType: AuthMethod | null
  blockchain: SupportedChainName | null
  is1cs: boolean
  preparationOutput:
    | {
        tag: "ok"
        value: {
          generateDepositAddress: string | null
          memo: string | null
        }
      }
    | {
        tag: "err"
        value: {
          reason: "ERR_GENERATING_ADDRESS"
        }
      }
    | null
  quote: QuoteResult | null
}

export const depositGenerateAddressMachine = setup({
  types: {
    context: {} as Context,
    input: {} as {
      is1cs: boolean
    },
    events: {} as
      | {
          type: "REQUEST_GENERATE_ADDRESS"
          params: NonNullable<
            Pick<Context, "userAddress" | "userChainType" | "blockchain">
          >
        }
      | {
          type: "REQUEST_CLEAR_ADDRESS"
        }
      | {
          type: "QUOTE_DATA_RECEIVED"
          params: {
            result:
              | {
                  ok: {
                    quote: {
                      amountIn: string
                      amountOut: string
                      deadline?: string
                    }
                    appFee: [string, bigint][]
                  }
                }
              | { err: string }
            tokenInAssetId: string
            tokenOutAssetId: string
          }
        },
  },
  actors: {
    generateDepositAddress: fromPromise(
      async (_: {
        input: {
          userAddress: string
          userChainType: AuthMethod
          blockchain: SupportedChainName
        }
      }): Promise<{
        generateDepositAddress: string | null
        memo: string | null
      }> => {
        throw new Error("not implemented")
      }
    ),
  },
  actions: {
    setInputParams: assign(({ event }) => {
      assertEvent(event, "REQUEST_GENERATE_ADDRESS")
      return {
        userAddress: event.params.userAddress,
        userChainType: event.params.userChainType,
        blockchain: event.params.blockchain,
      }
    }),
    resetPreparationOutput: assign(() => {
      return {
        preparationOutput: null,
      }
    }),
    processQuoteData: assign({
      // @ts-ignore TODO: fix this
      quote: ({ event }) => {
        assertEvent(event, "QUOTE_DATA_RECEIVED")
        // biome-ignore lint/suspicious/noConsole: <explanation>
        console.log("Quote data received:", event.params)
        return event.params
      },
    }),
  },
  guards: {
    isInputSufficient: ({ event }) => {
      assertEvent(event, "REQUEST_GENERATE_ADDRESS")
      if (
        event.params.blockchain === "turbochain" ||
        event.params.blockchain === "tuxappchain" ||
        event.params.blockchain === "vertex" ||
        event.params.blockchain === "optima" ||
        event.params.blockchain === "easychain" ||
        event.params.blockchain === "aurora" ||
        event.params.blockchain === "aurora_devnet"
      ) {
        return false
      }
      return (
        event.params.userAddress != null &&
        event.params.userChainType != null &&
        event.params.blockchain != null
      )
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QTABwPawJYBcDiYAdmAE4CGOYAghBCXLALJkDGAFlsQMQBKAogEUAqnwDKAFQD6ePgDk+PKuL6SqAETX9RogNoAGALqJQGbDizpCxkAE9EAWgAcAdgB0AVgA0IAB6J3AJwAzK7O7s6OAIwATO4AvnHeKKa4BMTklDR0DMzsnGC8giIS0nIKSirqmmK6kUZIICnmltZ+CAHujqHRAQAsAY6OekHuI162iNF6ka4AbJFBjrNBzgHB0b1LCUlomKlEpBTUtPSwTKwcxK4w6RScUFwQlmCunABu6ADWL8l7+AcZY7ZM65S4vG6HcyEKAId7oFh3Sz6AzI6xNCxWBptWaOdweXo9fqLAl6Wa9bx2BDRVahIKLSIBVaBZx6UbbEC-MxpSFA07nPJXCEZe5cUgkdAkVyoAA2FAAZhKALauTn7W6ZE45C75a4Au7Q2GED4I5qEZGohrolpYxA42auaKRPQBaKOIKRdx6XoLCmIEZdT2BXruHGxWIBBKJECEdAoeANVX-dW8rUCsBov4Y1qIXqLVxBYIFxmdAkbX0IeyRZy9VxrNbOHEe93ORbsxPcwFZPmgnVC-VQDNmLM2hCzZzRVx6al05nOMKzALlxmTxnTAm9Ya9HHONu7Ll6jXA-lg1wsdCKmVgSgQQe4YegNrVrpkxwEhkBBfzcvuBauRyMqY5yCVkf0iXcmg7I4u1TE8sAgaV00tTNrQfHMlnzQt6xLaIywmKlYknIICSI5wPVmZYcMjOIgA */
  context: ({ input }) => ({
    is1cs: input.is1cs,
    userAddress: null,
    userChainType: null,
    blockchain: null,
    preparationOutput: null,
    quote: null,
  }),

  id: "depositGenerateAddressMachine",

  on: {
    REQUEST_GENERATE_ADDRESS: [
      {
        actions: ["resetPreparationOutput", "setInputParams"],
        target: ".generating",
        guard: "isInputSufficient",
      },
      ".completed",
    ],
    REQUEST_CLEAR_ADDRESS: [
      {
        actions: ["resetPreparationOutput"],
        target: ".idle",
      },
    ],
    QUOTE_DATA_RECEIVED: {
      actions: "processQuoteData",
    },
  },

  states: {
    generating: {
      always: [
        {
          target: "generatingAddress1cs",
          guard: ({ context }) => {
            // biome-ignore lint/suspicious/noConsole: <explanation>
            console.log("context.is1cs", context.is1cs)
            return context.is1cs
          },
        },
        {
          target: "generatingAddress",
        },
      ],
    },
    generatingAddress1cs: {
      // Wait for quote data from parent
      on: {
        QUOTE_DATA_RECEIVED: {
          actions: "processQuoteData",
          target: "completed",
        },
      },
    },
    generatingAddress: {
      invoke: {
        input: ({ context }) => {
          assert(context.userAddress, "userAddress is null")
          assert(context.userChainType, "userChainType is null")
          assert(context.blockchain, "blockchain is null")
          return {
            userAddress: context.userAddress,
            userChainType: context.userChainType,
            blockchain: context.blockchain,
          }
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
          actions: assign({
            preparationOutput: {
              tag: "err",
              value: {
                reason: "ERR_GENERATING_ADDRESS",
              },
            },
          }),

          reenter: true,
        },
        src: "generateDepositAddress",
      },
    },

    completed: {},
    idle: {},
  },

  initial: "idle",
})
