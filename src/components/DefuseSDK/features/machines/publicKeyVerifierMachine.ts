import { logger } from "@src/utils/logger"
import type { providers } from "near-api-js"
import { assertEvent, assign, fromPromise, setup } from "xstate"
import { config } from "../../config"
import { hasPublicKey } from "../../services/intentsContractService"
import type { Transaction } from "../../types/deposit"
import {
  type WalletErrorCode,
  extractWalletErrorCode,
} from "../../utils/walletErrorExtractor"

export type SendNearTransaction = (
  tx: Transaction["NEAR"]
) => Promise<{ txHash: string } | null>

type Input = {
  nearAccount: { accountId: string; publicKey: string } | null
  nearClient: providers.Provider
}

export type ErrorCodes =
  | "ERR_PUBKEY_CHECK_FAILED"
  | "ERR_PUBKEY_ADDING_DECLINED"
  | "ERR_PUBKEY_ADDING_FAILED"
  | WalletErrorCode

type Output = { tag: "ok" } | { tag: "err"; value: ErrorCodes }

export interface Context extends Input {
  error: ErrorCodes | null
}

type Events =
  | { type: "ADD_PUBLIC_KEY"; sendNearTransaction: SendNearTransaction }
  | { type: "ABORT_ADD_PUBLIC_KEY" }

export const publicKeyVerifierMachine = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    output: {} as Output,
    events: {} as Events,
  },
  actors: {
    checkPubKeyActor: fromPromise(
      ({ input }: { input: Parameters<typeof hasPublicKey>[0] }) => {
        return hasPublicKey(input)
      }
    ),
    addPubKeyActor: fromPromise(
      ({ input }: { input: Parameters<typeof addPublicKeyToContract>[0] }) => {
        return addPublicKeyToContract(input)
      }
    ),
  },
  actions: {
    logError: (_, { error }: { error: unknown }) => {
      logger.error(error)
    },
    setError: assign({
      error: (_, { error }: { error: ErrorCodes }) => error,
    }),
  },
  guards: {
    isNonNearAccount: ({ context }) => {
      // Don't need to check public key if it is not Near account,
      // because public key cannot change for non-Near accounts.
      return context.nearAccount == null
    },
    isTrue: (_, value: boolean) => value,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcCuAjANgSwMYGkwBPANTACdsAzbCgOmwkzAGIBtABgF1EUB7WNgAu2PgDteIAB6IAjACYArHQBsigBybZK+QE5dHWQGZ5AGhBFE62XRN7tugOwAWWbsWKVAXy-m0WPEJSCmpacgYmVjZZHiQQZAFhUQk4mQQFZTVNax19QxNzSwR5dSM6DgNdayNnZxLPHz8MHAJiMkoaelwACzBcAGtsMSgWCHEwBjEANz5+iZ6+-oAFDCCAJTAqTlj+QRFxSTSVdXly40NtFRd1WsLEPVPHDgr1FWc1N0UjRvjmwLaQp1wgsBkMRmMxBMhjM5nQQctVsQNlsYpIEntkodEJ5HipdLInrp5G4bs47ggjNZbESCSZtDVHIofv4WkF2qEur1QcMWBRyHxwshMABDIRUAUAWzhXIR6HWm22aMS+xSoDSsg4RmUJKMul1RjxzgN5KUKlUeI47y1VUMjkczL+rWCHTC0sWkBYAEEACLegD6SwAqgAhAAyAEkAMJ+-AAUQAmoq4uikgdUohHLIbCpddpHKUOEpdCpyYo3HRjOpFCUOFdHFqHQEneygXRhRAIGDRuNJjCJu2ICs5UiFdwlRi02q5EZZJkZ4yrcd3Ipyc5XnR3O9nJrnHaFN9fL8m2zAa6B12IVDprN+x2h-KUTt4srMen0ios+V3PInnpM0SyQsRAtzoeQjGeIx-xqWR1F0RtWQBF16HPHk+QFOghVFcVyClAd7xHLYx2TF9J2kOQ3jNPVKT0HNrAqRxyRMZw6FePUdCuAxMxqHxDzEPgIDgNFHRPJDyHHVNVTIhAAFoSyAmTlH0fR1EcFQrg4etTXg-5nQ5cJGGYcSVSxBA6nJKtVC+eRa11fM8mcbTm1PTlFjBIzXynYoVLoRxdDqFSKg8azVJNRRHDoRR8Q-Cp1P0bxDxZHSW1deFIHc0i0i+M1YOcL4FDeSDZFLGCWNratng1d5q0ckS9LbDs3OIidJLSJx1FA2DnieRRnicXRV3cakCTxNQ9Ss+KmmPRC6twPgJSFMAhDSpqJJMy52pONiTBcDSXHJPy6FcbcNCULNiTtHivCAA */
  id: "publicKeyVerifier",
  initial: "idle",
  context: ({ input }) => {
    return {
      ...input,
      error: null,
    }
  },
  output: ({ context }) => {
    return context.error == null
      ? { tag: "ok" }
      : { tag: "err", value: context.error }
  },
  states: {
    idle: {
      always: [
        {
          target: "completed",
          guard: "isNonNearAccount",
        },
        {
          target: "checking",
        },
      ],
    },

    checking: {
      invoke: {
        id: "checkPubKeyRef",
        src: "checkPubKeyActor",
        input: ({ context }) => {
          if (context.nearAccount == null) {
            throw new Error("no near account")
          }

          return {
            nearClient: context.nearClient,
            ...context.nearAccount,
          }
        },
        onDone: [
          {
            target: "completed",
            guard: {
              type: "isTrue",
              params: ({ event }) => event.output,
            },
          },
          {
            target: "checked",
          },
        ],
        onError: {
          target: "completed",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: {
                error: "ERR_PUBKEY_CHECK_FAILED",
              },
            },
          ],
        },
      },
    },

    checked: {
      on: {
        ADD_PUBLIC_KEY: {
          target: "adding",
        },
        ABORT_ADD_PUBLIC_KEY: {
          target: "completed",
          actions: {
            type: "setError",
            params: {
              error: "ERR_PUBKEY_ADDING_DECLINED",
            },
          },
        },
      },
    },

    adding: {
      invoke: {
        id: "addPubKeyRef",
        src: "addPubKeyActor",
        input: ({ context, event }) => {
          assertEvent(event, "ADD_PUBLIC_KEY")

          if (context.nearAccount == null) {
            throw new Error("no near account")
          }

          return {
            pubKey: context.nearAccount.publicKey,
            sendNearTransaction: event.sendNearTransaction,
          }
        },
        onDone: "completed",
        onError: {
          target: "completed",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: ({ event }) => {
                return {
                  error: extractWalletErrorCode(
                    event.error,
                    "ERR_PUBKEY_ADDING_FAILED"
                  ),
                }
              },
            },
          ],
        },
      },
    },

    completed: {
      type: "final",
    },
  },
})

async function addPublicKeyToContract({
  pubKey,
  sendNearTransaction,
}: {
  pubKey: string
  sendNearTransaction: SendNearTransaction
}): Promise<boolean> {
  const tx: Transaction["NEAR"] = {
    receiverId: config.env.contractID,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: "add_public_key",
          args: { public_key: pubKey },
          gas: "5000000000000",
          deposit: "1",
        },
      },
    ],
  }
  return (await sendNearTransaction(tx)) != null
}
