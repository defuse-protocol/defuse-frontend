import type { MultiPayload } from "@defuse-protocol/contract-types"
import { solverRelay } from "@defuse-protocol/internal-utils"
import { logger } from "@src/utils/logger"
import { assign, fromPromise, setup } from "xstate"
import {
  type PublishIntentsErr,
  convertPublishIntentsToLegacyFormat,
} from "../../../sdk/solverRelay/publishIntents"
import { assert } from "../../../utils/assert"
import type { Errors as SignIntentErrors } from "../../machines/signIntentMachine"

export type GiftMakerPublishingActorInput = {
  multiPayload: MultiPayload
}

export type GiftMakerPublishingActorOutput =
  | {
      giftStatus: "published"
      intentHashes: string[]
    }
  | {
      giftStatus: "not_published"
    }

export type GiftMakerPublishingActorErrors =
  | SignIntentErrors
  | PublishIntentsErr
  | { reason: "ERR_GIFT_PUBLISHING" }
  | { reason: "EXCEPTION" }

type GiftMakerPublishingActorContext = {
  multiPayload: MultiPayload
  intentHashes: null | string[]
  error: null | GiftMakerPublishingActorErrors
}

export const giftMakerPublishingActor = setup({
  types: {
    input: {} as GiftMakerPublishingActorInput,
    output: {} as GiftMakerPublishingActorOutput,
    context: {} as GiftMakerPublishingActorContext,
  },
  actors: {
    publishActor: fromPromise(({ input }: { input: MultiPayload }) => {
      return solverRelay
        .publishIntents({
          quote_hashes: [],
          signed_datas: [input],
        })
        .then(convertPublishIntentsToLegacyFormat)
        .then((result) => {
          if (result.isErr()) {
            return { tag: "err" as const, value: result.unwrapErr() }
          }
          const intentHashes = result.unwrap()
          assert(intentHashes != null)
          return { tag: "ok" as const, value: intentHashes }
        })
    }),
  },
  actions: {
    logError: (_, event: { error: unknown }) => {
      logger.error(event.error)
    },
    setError: assign({
      error: (_, error: GiftMakerPublishingActorErrors) => error,
    }),
    clearError: assign({ error: null }),
  },
  guards: {
    isOk: (_, params: { tag: "ok" | "err" }) => params.tag === "ok",
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOlwgBswBiAYQHkA5AMQEkAlAWQH0AFAVQBCAGVYBlABKtGAcQDaABgC6iUAAcA9rFwAXXBvyqQAD0QBaABwkArAHYALACYFthQoCcrgGz3bAGhAAT0RbWy8STwBGX2sAZgsLUNiAX2SAtCw8QlJyKmoAQUF6dgAVPiFRSWl5ZSNNbT0DI1MEM3tYyJIva0iFe0Te9tjrAOCEUPComPjE2w7U9IwcAmIyShpFFSQQet19Q22Ws2cFCPb7FzCFOOtu0ZDbdxJHR2jux0fuuwWQDOXstZUfj4TDoEFgCgUdAAIzy+VoAGlyiJxFJZNxWJxePQxGJWCIAKKbOpaPZNQ6ILyxWIkXyRTzXWIMizue4ISK9Tqhez2aKxNyOexeRw-P5ZVZqACusNwsCyUGoEAMYDI+AAbhoANYqsUrUhSmVyghQBAEDWgxr4TbE7a7S3NcyOcJeBSRW7xN3WNwWLz+IKIXoKGnWHlOwVe-kuUVLcX66UUWXyxXK1Ua7UkXUAg0Jo34E1mjQW-bWyJbdSk+0UhCOaxPeIOGuxULuO7+9luYOh4X2CNuWzRzJ6kjZxPG5OEVNanUxocj3P59WF9CW62OMs7Cv7B3V9xWLzuWs+D7xWJs0LWCKOCy+dzuRyR6zWAf-CXx0d56hgABOX40X+HUI6AAZn+qAZjOWZvvOpqLkWBjWrUtqbuSoBHI4u42LYkSxEK6HYY+vpshYj5dAesToTyOEciKPz4BoEBwEYmbECSDRblWbSPF0PR9AMfTUiMbbCuEPJ3i87i+Nc+7PrGgJgKxZIHKhlKOCQFiRD4kQsuh7i9I+9hnthZxibY1gWEyjwyUOuRgMCoLgpCMJUAplbKQgwwXpEtg1rcXp2K8FhshyrokNyTYeCynyRFZkGGvKLnsW5ChEb6JDRNe-LEa8nj2DFr5xZACUoSYiD3qFd4tsFLghhcBltlVNiChZHi1lhFh5aQkogmCmAQlCsLyUhbHFS0gZPAoLLmfSkQUay9WBo15y+Ne2kdSQMJ-johVDYp25tAoql9BJuk+h4t4uEFC3WE1CQtVR-apMkQA */
  context: ({ input }) => ({
    ...input,
    intentHashes: null,
    error: null,
  }),

  output: ({ context }) => {
    if (!context.intentHashes) {
      return {
        giftStatus: "not_published",
      }
    }
    return {
      giftStatus: "published",
      intentHashes: context.intentHashes,
    }
  },

  initial: "publishing",

  states: {
    publishing: {
      invoke: {
        src: "publishActor",
        input: ({ context }) => context.multiPayload,

        onError: {
          target: "#(machine).aborted",
          actions: [
            { type: "logError", params: ({ event }) => event },
            { type: "setError", params: { reason: "ERR_GIFT_PUBLISHING" } },
          ],
        },

        onDone: [
          {
            target: "#(machine).published",
            guard: {
              type: "isOk",
              params: ({ event }) => {
                return event.output
              },
            },
            actions: assign({
              intentHashes: ({ event }) => {
                assert(event.output.tag === "ok")
                return event.output.value
              },
            }),
          },
          {
            target: "#(machine).aborted",
            actions: {
              type: "setError",
              params: ({ event }) => {
                assert(event.output.tag === "err")
                return event.output.value
              },
            },
          },
        ],
      },
    },

    published: {
      type: "final",
    },

    uncancellable: {
      type: "final",
    },

    aborted: {
      type: "final",
    },
  },
})
