import type { MultiPayload } from "@defuse-protocol/contract-types"
import { errors } from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import { assertEvent, assign, fromPromise, setup } from "xstate"
import { nearClient } from "../../constants/nearClient"
import {
  type SignerCredentials,
  formatSignedIntent,
} from "../../core/formatters"
import { logger } from "../../logger"
import { assert } from "../../utils/assert"
import { verifyWalletSignature } from "../../utils/verifyWalletSignature"
import {
  type WalletErrorCode,
  extractWalletErrorCode,
} from "../../utils/walletErrorExtractor"
import type { SignMessage } from "../otcDesk/types/sharedTypes"
import {
  type ErrorCodes as PublicKeyVerifierErr,
  publicKeyVerifierMachine,
} from "./publicKeyVerifierMachine"

export type Errors = {
  reason:
    | "EXCEPTION"
    | "ERR_USER_DIDNT_SIGN"
    | "ERR_CANNOT_VERIFY_SIGNATURE"
    | "ERR_SIGNED_DIFFERENT_ACCOUNT"
    | WalletErrorCode
    | PublicKeyVerifierErr
  error: Error | null
}

export type Success = {
  multiPayload: MultiPayload
  signatureResult: walletMessage.WalletSignatureResult
  signerCredentials: SignerCredentials
}

type Context = {
  signerCredentials: SignerCredentials
  signature: walletMessage.WalletSignatureResult | null
  error: null | Errors
}

export type Input = {
  signerCredentials: SignerCredentials
  signMessage: SignMessage
  walletMessage: walletMessage.WalletMessage
}

export type Output =
  | { tag: "err"; value: Errors }
  | { tag: "ok"; value: Success }

export const signIntentMachine = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    output: {} as Output,
  },
  actions: {
    logError: (_, event: { error: unknown }) => {
      logger.error(event.error)
    },
    setError: assign({
      error: (_, error: Errors) => error,
    }),
    setSignature: assign({
      signature: (_, signature: walletMessage.WalletSignatureResult | null) =>
        signature,
    }),
  },
  actors: {
    verifySignatureActor: fromPromise(
      ({
        input,
      }: {
        input: {
          signature: walletMessage.WalletSignatureResult
          signerCredentials: SignerCredentials
        }
      }) =>
        verifyWalletSignature(
          input.signature,
          input.signerCredentials.credential
        )
    ),
    task: fromPromise(
      async ({
        input,
      }: { input: () => Promise<unknown> }): Promise<unknown> => {
        return input()
      }
    ),
    publicKeyVerifierActor: publicKeyVerifierMachine,
  },
  guards: {
    isTrue: (_, params: boolean) => params,
    isOk: (_, params: { tag: "ok" } | { tag: "err" }) => params.tag === "ok",
  },
}).createMachine({
  context: ({ input }) => {
    return {
      signerCredentials: input.signerCredentials,
      signature: null,
      error: null,
    }
  },

  initial: "Signing",

  output: ({ context }): Output => {
    if (context.error != null) {
      return { tag: "err", value: context.error }
    }

    assert(context.signature != null, "Signature is not set")

    return {
      tag: "ok",
      value: {
        multiPayload: formatSignedIntent(
          context.signature,
          context.signerCredentials
        ),
        signatureResult: context.signature,
        signerCredentials: context.signerCredentials,
      },
    }
  },

  states: {
    Signing: {
      invoke: {
        src: "task",

        input: ({ event }) => {
          assertEvent(event, "xstate.init")
          const input = event.input as Input
          return () => {
            return input.signMessage(input.walletMessage)
          }
        },

        onDone: {
          target: "Verifying Signature",

          actions: {
            type: "setSignature",
            params: ({ event }) =>
              event.output as Awaited<ReturnType<SignMessage>>,
          },
        },

        onError: {
          target: "Generic Error",
          description: "USER_DIDNT_SIGN",

          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: ({ event }) => {
                return {
                  reason: extractWalletErrorCode(
                    event.error,
                    "ERR_USER_DIDNT_SIGN"
                  ),
                  error: errors.toError(event.error),
                }
              },
            },
          ],
        },
      },
    },

    "Verifying Signature": {
      invoke: {
        src: "verifySignatureActor",
        input: ({ context }) => {
          assert(context.signature != null, "Signature is not set")
          return {
            signature: context.signature,
            signerCredentials: context.signerCredentials,
          }
        },
        onDone: [
          {
            target: "Verifying Public Key Presence",
            guard: {
              type: "isTrue",
              params: ({ event }) => event.output,
            },
          },
          {
            target: "Generic Error",
            description: "SIGNED_DIFFERENT_ACCOUNT",
            actions: {
              type: "setError",
              params: {
                reason: "ERR_SIGNED_DIFFERENT_ACCOUNT",
                error: null,
              },
            },
          },
        ],

        onError: {
          target: "Generic Error",
          description: "ERR_CANNOT_VERIFY_SIGNATURE",

          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: ({ event }) => ({
                reason: "ERR_CANNOT_VERIFY_SIGNATURE",
                error: errors.toError(event.error),
              }),
            },
          ],
        },
      },
    },

    "Verifying Public Key Presence": {
      invoke: {
        id: "publicKeyVerifierRef",
        src: "publicKeyVerifierActor",

        input: ({ context }) => {
          assert(context.signature != null)

          return {
            nearAccount:
              context.signature.type === "NEP413"
                ? context.signature.signatureData
                : null,
            nearClient,
          }
        },

        onError: {
          target: "Generic Error",
          description: "ERR_PUBKEY_EXCEPTION",

          actions: [
            { type: "logError", params: ({ event }) => event },
            { type: "setError", params: { reason: "EXCEPTION", error: null } },
          ],
        },

        onDone: [
          {
            target: "Completed",
            guard: {
              type: "isOk",
              params: ({ event }) => event.output,
            },
          },
          {
            target: "Generic Error",
            description: "ERR_PUBKEY_*",

            actions: {
              type: "setError",
              params: ({ event }) => {
                assert(event.output.tag === "err")
                return { reason: event.output.value, error: null }
              },
            },
          },
        ],
      },
    },

    Completed: {
      type: "final",
    },

    "Generic Error": {
      type: "final",
    },
  },
})
