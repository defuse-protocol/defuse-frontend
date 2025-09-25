import type { MultiPayload } from "@defuse-protocol/contract-types"
import {
  messageFactory,
  type walletMessage,
} from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"
import { type PromiseActorLogic, assertEvent, setup } from "xstate"
import {
  type SignerCredentials,
  formatSignedIntent,
} from "../../../core/formatters"
import { createTransferMessage } from "../../../core/messages"
import { logger } from "../../../logger"
import { calculateSplitAmounts } from "../../../sdk/aggregatedQuote/calculateSplitAmounts"
import { AmountMismatchError } from "../../../sdk/aggregatedQuote/errors/amountMismatchError"
import type { BaseTokenInfo, TokenInfo, TokenValue } from "../../../types/base"
import { findError } from "../../../utils/errors"
import {
  adjustDecimals,
  getAnyBaseTokenInfo,
  getUnderlyingBaseTokenInfos,
} from "../../../utils/tokenUtils"
import type { BalanceMapping } from "../../machines/depositedBalanceMachine"
import {
  type Errors as SignIntentErrors,
  type Input as SignIntentInput,
  type Output as SignIntentOutput,
  signIntentMachine,
} from "../../machines/signIntentMachine"
import type { SignMessage } from "../types/sharedTypes"
import type { EscrowCredentials } from "../utils/generateEscrowCredentials"

export type GiftMakerSignActorInput = {
  parsed: {
    token: TokenInfo
    amount: TokenValue
    message: string
  }
  balances: BalanceMapping
  signerCredentials: SignerCredentials
  signMessage: SignMessage
  referral: string | undefined
  escrowCredentials: EscrowCredentials
}

export type GiftMakerSignActorErrors =
  | SignIntentErrors
  | { reason: "ERR_GIFT_SIGNING" }

export type GiftMakerSignActorOutput =
  | { tag: "err"; value: GiftMakerSignActorErrors }
  | {
      tag: "ok"
      value: {
        multiPayload: MultiPayload
        signerCredentials: SignerCredentials
        signatureResult: walletMessage.WalletSignatureResult
        escrowCredentials: EscrowCredentials
        giftId: string
      }
    }

export type GiftMakerSignActorContext = {
  parsed: GiftMakerSignActorInput["parsed"]
  signerCredentials: GiftMakerSignActorInput["signerCredentials"]
  walletMessage: walletMessage.WalletMessage
  escrowCredentials: EscrowCredentials
}

export const giftMakerSignActor = setup({
  types: {
    input: {} as GiftMakerSignActorInput,
    output: {} as GiftMakerSignActorOutput,
    context: {} as GiftMakerSignActorContext,
    events: {} as
      | { type: "xstate.init"; input: GiftMakerSignActorInput }
      | { type: "COMPLETE"; output: GiftMakerSignActorOutput },
  },
  actors: {
    signActor: signIntentMachine as unknown as PromiseActorLogic<
      SignIntentOutput,
      SignIntentInput
    >,
  },
  actions: {
    logError: (_, event: { error: unknown }) => {
      logger.error(event.error)
    },
    complete: ({ self }, output: GiftMakerSignActorOutput) => {
      self.send({ type: "COMPLETE", output })
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOllynwKgGIIB7QkggN3oGswyL8AlMAGYBtAAwBdRKAAO9cgBdcjSSAAeiAIwBOACwkRADk36ArIZEA2Y+pFGANCACeicyQDsr9Sc0XjAZm3mNgBMAL4h9mhYeISk5JTUNGAATkn0SSRSADbocgJpqNyU-MLiyjLyivjKaggAtMZBJL6uxiK++tqaQa3mHeb2Tggu7p7G3pb+gV1hERg4BMSFVPi0AMIA8gCyAAoAMgCiACr7ohJIIOW4CkrnNdoiriTm6kFB5r6+xla+mv2OiLVzI99J8gq4ROogQZ9OpXGFwiB8PQIHBlJF5jEyrIrpVqgDrCImi02h0uj0TAMAUFISRtOp6a8Gi9-O0ZiB0dFFnFllAsRUbqA7oSwZpfD4Ya5tGNjH9BrUXvoSJp6S9lWLtPpXB02RyFqRMPRUFkwHJIHycQLVIgfroglKHi8ZR9PpSEPdaZLNK5la11L4Xq5zPCQkA */
  initial: "signing",

  context: ({ input }) => {
    let tokenDiff: Record<BaseTokenInfo["defuseAssetId"], bigint>

    try {
      tokenDiff = calculateSplitAmounts(
        getUnderlyingBaseTokenInfos(input.parsed.token),
        input.parsed.amount,
        input.balances
      )

      for (const [assetId, amount] of Object.entries(tokenDiff)) {
        tokenDiff[assetId] = amount
      }
    } catch (err: unknown) {
      if (!findError(err, AmountMismatchError)) {
        throw err
      }

      /**
       * If user has insufficient balance, we will generate a message with the full amount,
       * and let the user know that they have insufficient balance.
       */
      const token = getAnyBaseTokenInfo(input.parsed.token)
      tokenDiff = {
        [token.defuseAssetId]: adjustDecimals(
          input.parsed.amount.amount,
          input.parsed.amount.decimals,
          token.decimals
        ),
      }
    }

    const walletMessage = createTransferMessage(Object.entries(tokenDiff), {
      signerId: input.signerCredentials,
      referral: input.referral,
      memo: "GIFT_CREATE",
      receiverId: input.escrowCredentials.credential,
    })

    return {
      walletMessage,
      parsed: input.parsed,
      signerCredentials: input.signerCredentials,
      escrowCredentials: input.escrowCredentials,
    }
  },

  output: ({ event }) => {
    return event.output as GiftMakerSignActorOutput
  },

  states: {
    signing: {
      invoke: {
        id: "signRef",
        src: "signActor",

        input: ({ event, context }) => {
          assertEvent(event, "xstate.init")
          const input = event.input

          return {
            signMessage: input.signMessage,
            signerCredentials: context.signerCredentials,
            walletMessage: context.walletMessage,
          }
        },

        onDone: {
          actions: [
            {
              type: "complete",
              params: ({
                context,
                event,
              }: {
                context: GiftMakerSignActorContext
                event: { output: SignIntentOutput }
              }) => {
                if (event.output.tag === "ok") {
                  return {
                    tag: "ok",
                    value: {
                      ...event.output.value,
                      escrowCredentials: context.escrowCredentials,
                      giftId: base64.encode(messageFactory.randomDefuseNonce()),
                    },
                  }
                }
                return event.output
              },
            },
          ],
        },

        onError: {
          actions: [
            { type: "logError", params: ({ event }) => event },
            {
              type: "complete",
              params: { tag: "err", value: { reason: "ERR_GIFT_SIGNING" } },
            },
          ],
        },
      },

      on: {
        COMPLETE: "completed",
      },
    },

    completed: {
      type: "final",
      output: ({ context, event }): GiftMakerSignActorOutput => {
        assertEvent(event, "COMPLETE")

        if (event.output.tag === "err") {
          return event.output
        }

        const multiPayload = formatSignedIntent(
          event.output.value.signatureResult,
          context.signerCredentials
        )

        return {
          tag: "ok",
          value: {
            ...event.output.value,
            multiPayload,
          },
        }
      },
    },
  },
})
