import { errors } from "@defuse-protocol/internal-utils"
import { logger } from "@src/utils/logger"
import { assign, fromPromise, setup } from "xstate"
import { emitEvent } from "../../services/emitter"
import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenDeployment,
} from "../../types/base"
import { assert } from "../../utils/assert"
import type { DepositMode } from "./depositFormReducer"

export type Context = Input & {
  txHash: string | null
  error: ErrorState | null
}

export type Input = {
  chainName: SupportedChainName
  derivedToken: BaseTokenInfo
  tokenDeployment: TokenDeployment
  balance: bigint
  amount: bigint
  userAddress: string
  userWalletAddress: string | null
  depositAddress: string | null
  storageDepositAmount: bigint | null
  solanaATACreationRequired: boolean
  tonJettonWalletCreationRequired: boolean
  nearBalance: bigint | null
  type: string
  memo: string | null
  depositMode: DepositMode
}

export type DepositDescription = {
  type: string
  amount: bigint
  userAddress: string
  userWalletAddress: string | null
  derivedToken: BaseTokenInfo
  tokenDeployment: TokenDeployment
  depositAddress: string | null
  memo: string | null
  depositMode: DepositMode
}

export type Output =
  | {
      tag: "ok"
      value: {
        txHash: string
        depositDescription: DepositDescription
      }
    }
  | {
      tag: "err"
      value: {
        reason: ErrorReason
      }
    }

export type ErrorReason =
  | "ERR_SUBMITTING_TRANSACTION"
  | "ERR_VERIFYING_TRANSACTION"
  | "ERR_DEPOSIT_PARAMS_INVALID"

export type ErrorState = {
  reason: ErrorReason
  error: Error | null
}

export const depositMachine = setup({
  types: {} as {
    context: Context
    input: Input
    output: Output
    error: Error
  },
  actors: {
    signAndSendTransactions: fromPromise(
      async (_: { input: Input }): Promise<string> => {
        throw new Error("not implemented")
      }
    ),
    validateTransaction: fromPromise(
      async (_: {
        input: Context & { txHash: string }
      }): Promise<boolean> => {
        throw new Error("not implemented")
      }
    ),
  },
  actions: {
    setTxHash: assign({
      txHash: ({ event }) => event.output,
    }),
    logError: (_, params: { error: unknown }) => {
      logger.error(params.error)
    },
    setError: assign({
      error: (_, params: ErrorState) => {
        return params
      },
    }),
    emitDepositInitiated: ({ context }) => {
      emitEvent("deposit_initiated", {
        token: context.derivedToken.symbol,
        amount: {
          amount: context.amount,
          decimals: context.tokenDeployment.decimals,
        },
        wallet_type: context.tokenDeployment.chainName,
      })
    },
    emitDepositSuccess: ({ context }) => {
      emitEvent("deposit_success", {
        tx_hash: context.txHash,
        token: context.derivedToken.symbol,
        amount: {
          amount: context.amount,
          decimals: context.tokenDeployment.decimals,
        },
        network: context.tokenDeployment.chainName,
      })
    },
  },
  guards: {
    isDepositParamsValid: () => {
      throw new Error("not implemented")
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QTABwPawJYBcB0WEANmAMQDaADALqKgbY5boB2dIAHogLQCMAnJTz8ATABZeAZgAcAVlm9pkyQDYVAGhABPRLzV4VlJdLEB2WWKP9+AXxuaUDXAWJlyvWkhBOmrdlwRuMTF+PFVRUxFpaREpaM0dBEtZPEoVeVNTXhFTFX4VOwc0TGdsKBYsFihSCFYwAhYAN3QAa3qylgBBFggAZTAegBUAJwBDFlhRgGNfCapPehLZ-0R0vF4xSRF+aVN+YL1JBMQJFWFKSklTMQsxGMlZQpBHJbwOyuqwYeH0YbxUIijHAAM1+AFs3lhyt0+gMICNxpMZsw5jR2D4UStAiJDHgRKpeJFJGZKLJzMckpc8GJ8dJspRgvdHvZnsVGHhGl8sMCtB8anUGs02hzRkRCECwAiJtNZvN0UtMV4AopJNSVNJrIpRGoYhTImcTFtrFcVISRCIni92ZzhtzeVVSF8fn8AUDQcMIY1ReKcJKxtLkaw5V4MX4lTxZCI8QIsvILBcE2I9VTpGpzLFifkpHYWSx0Ch4F4rbh5YxFaAAkF+KYwnkclEYnFpBSztXJLxFNk7ltpJReJa2c5CCRS7hy5wePSwjIRH3SSrVBptIh9tTTO2jOatiEjAOfJDyh9R8tw9jcnhZNFZ7x50pFxSRPJqbsdgptrJ+LIVGI968bXajxDBUwwrHghFkSh6wZORLDub9m2XBAvyjFRMnbSx1WsTJf3ZYFRiwEgIGPcdK02FJZGUZQKMbGQEMSEwUPNUwTC-fgtnxHDnCmdAwQBMBfSIoCyxAicEFiXg8D2LI9A1HF1RECklDEakLFUNJTQubMcyAA */
  id: "deposit",

  context: ({ input }) => ({
    ...input,
    txHash: null,
    error: null,
  }),

  initial: "idle",

  output: ({ context }): Output => {
    if (context.txHash != null) {
      return {
        tag: "ok",
        value: {
          txHash: context.txHash,
          depositDescription: {
            type: context.type,
            userAddress: context.userAddress,
            userWalletAddress: context.userWalletAddress,
            amount: context.amount,
            derivedToken: context.derivedToken,
            tokenDeployment: context.tokenDeployment,
            depositAddress: context.depositAddress,
            memo: context.memo,
            depositMode: context.depositMode,
          },
        },
      }
    }

    if (context.error != null) {
      return {
        tag: "err",
        value: {
          reason: context.error.reason,
        },
      }
    }

    throw new Error("Unexpected output")
  },

  states: {
    idle: {
      always: [
        {
          target: "signing",
          guard: "isDepositParamsValid",
        },
        {
          target: "failed",
          actions: [
            {
              type: "logError",
              params: () => {
                return {
                  error: new Error("Error in deposit params"),
                }
              },
            },
            {
              type: "setError",
              params: () => ({
                reason: "ERR_DEPOSIT_PARAMS_INVALID",
                error: null,
              }),
            },
          ],
        },
      ],
    },

    signing: {
      invoke: {
        id: "signAndSendTransactions",

        input: ({ context }) => context,

        onDone: {
          target: "verifying",
          actions: "setTxHash",
        },
        onError: {
          target: "failed",
          actions: [
            {
              type: "logError",
              params: ({ event }) => ({ error: event }),
            },
            {
              type: "setError",
              params: ({ event }) => {
                return {
                  reason: "ERR_SUBMITTING_TRANSACTION",
                  error: errors.toError(event.error),
                }
              },
            },
          ],
        },
        src: "signAndSendTransactions",
      },
      entry: ["emitDepositInitiated"],
    },

    verifying: {
      invoke: {
        id: "validateTransaction",

        input: ({ context }) => {
          const { txHash, ...rest } = context
          assert(txHash != null, "txHash is null")
          return { ...rest, txHash }
        },

        onDone: {
          target: "completed",
          reenter: true,
        },
        onError: {
          target: "failed",
          actions: [
            {
              type: "logError",
              params: ({ event }) => ({ error: event }),
            },
            {
              type: "setError",
              params: () => ({
                reason: "ERR_VERIFYING_TRANSACTION",
                error: null,
              }),
            },
          ],
        },
        src: "validateTransaction",
      },
    },

    failed: {
      type: "final",
    },

    completed: {
      type: "final",
      entry: ["emitDepositSuccess"],
    },
  },
})
