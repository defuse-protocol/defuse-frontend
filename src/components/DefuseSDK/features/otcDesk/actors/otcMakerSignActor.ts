import type { MultiPayload } from "@defuse-protocol/contract-types"
import { VersionedNonceBuilder } from "@defuse-protocol/intents-sdk"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"
import { nearClient } from "@src/components/DefuseSDK/constants/nearClient"
import { salt } from "@src/components/DefuseSDK/services/intentsContractService"
import { assert } from "@src/components/DefuseSDK/utils/assert"
import { logger } from "@src/utils/logger"
import { assertEvent, assign, fromPromise, setup } from "xstate"
import {
  type SignerCredentials,
  formatSignedIntent,
} from "../../../core/formatters"
import { createSwapIntentMessage } from "../../../core/messages"
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
  type Output as SignIntentMachineOutput,
  signIntentMachine,
} from "../../machines/signIntentMachine"
import type { SignMessage } from "../types/sharedTypes"
import { type Expiry, expiryToSeconds } from "../utils/expiryUtils"

export type OTCMakerSignActorInput = {
  parsed: {
    tokenIn: TokenInfo
    tokenOut: BaseTokenInfo
    amountIn: TokenValue
    amountOut: TokenValue
    expiry: Expiry
  }
  balances: BalanceMapping
  signerCredentials: SignerCredentials
  signMessage: SignMessage
  referral: string | undefined
}

export type OTCMakerSignActorOutput =
  | { tag: "err"; value: OTCMakerSignActorErrors }
  | { tag: "ok"; value: OTCMakerSignActorSuccess }

export type OTCMakerSignActorSuccess = {
  multiPayload: MultiPayload
  signatureResult: walletMessage.WalletSignatureResult
  signerCredentials: SignerCredentials
  usedNonceBase64: string
}

export type OTCMakerSignActorContext = OTCMakerSignActorInput & {
  nonce: Uint8Array | null
  walletMessage: walletMessage.WalletMessage | null
}

export type OTCMakerSignActorErrors = SignIntentErrors | { reason: "EXCEPTION" }

export const otcMakerSignMachine = setup({
  types: {
    input: {} as OTCMakerSignActorInput,
    output: {} as OTCMakerSignActorOutput,
    context: {} as OTCMakerSignActorContext,
    events: {} as
      | { type: "xstate.init"; input: OTCMakerSignActorInput }
      | { type: "COMPLETE"; output: SignIntentMachineOutput },
    children: {} as {
      signRef: "signActor"
    },
  },
  actors: {
    signActor: signIntentMachine,
    prepareSignData: fromPromise(
      async ({
        input,
      }: { input: OTCMakerSignActorContext }): Promise<{
        nonce: Uint8Array
        walletMessage: walletMessage.WalletMessage
      }> => {
        const deadline =
          Date.now() + expiryToSeconds(input.parsed.expiry) * 1000
        const nonce = base64.decode(
          VersionedNonceBuilder.encodeNonce(
            await salt({ nearClient }),
            new Date(deadline)
          )
        )

        let tokenInDiff: Record<BaseTokenInfo["defuseAssetId"], bigint>

        try {
          tokenInDiff = calculateSplitAmounts(
            getUnderlyingBaseTokenInfos(input.parsed.tokenIn),
            input.parsed.amountIn,
            input.balances
          )

          for (const [assetId, amount] of Object.entries(tokenInDiff)) {
            // We need to negate the amount, as the balance is being reduced
            tokenInDiff[assetId] = -amount
          }
        } catch (err: unknown) {
          if (!findError(err, AmountMismatchError)) {
            throw err
          }

          /**
           * If user has insufficient balance, we will generate a message with the full amount,
           * and let the user know that they have insufficient balance.
           */
          const tokenIn = getAnyBaseTokenInfo(input.parsed.tokenIn)
          tokenInDiff = {
            [tokenIn.defuseAssetId]: adjustDecimals(
              // We need to negate the amount, as the balance is being reduced
              -input.parsed.amountIn.amount,
              input.parsed.amountIn.decimals,
              tokenIn.decimals
            ),
          }
        }

        const walletMessage = createSwapIntentMessage(
          [
            ...Object.entries(tokenInDiff),
            [
              input.parsed.tokenOut.defuseAssetId,
              input.parsed.amountOut.amount,
            ],
          ],
          {
            signerId: input.signerCredentials,
            nonce,
            referral: input.referral,
            memo: "OTC_CREATE",
            deadlineTimestamp: deadline,
          }
        )
        return { nonce, walletMessage }
      }
    ),
  },
  actions: {
    logError: (_, event: { error: unknown }) => {
      logger.error(event.error)
    },
    complete: ({ self }, output: SignIntentMachineOutput) => {
      self.send({ type: "COMPLETE", output })
    },
  },
}).createMachine({
  initial: "prepareData",

  context: ({ input }) => {
    return {
      ...input,
      nonce: null,
      walletMessage: null,
    }
  },

  output: ({ event }) => {
    return event.output as OTCMakerSignActorOutput
  },

  states: {
    prepareData: {
      invoke: {
        src: "prepareSignData",
        input: ({ context }) => context,
        onDone: {
          target: "signing",
          actions: assign(({ event, context }) => {
            return {
              ...context,
              nonce: event.output.nonce,
              walletMessage: event.output.walletMessage,
            }
          }),
        },
        onError: {
          actions: [
            { type: "logError", params: ({ event }) => event },
            {
              type: "complete",
              params: {
                tag: "err",
                value: { reason: "EXCEPTION", error: null },
              },
            },
          ],
        },
      },

      on: {
        COMPLETE: "completed",
      },
    },

    signing: {
      invoke: {
        id: "signRef",
        src: "signActor",

        input: ({ context }) => {
          assert(context.walletMessage !== null)

          return {
            signMessage: context.signMessage,
            signerCredentials: context.signerCredentials,
            walletMessage: context.walletMessage,
          }
        },

        onError: {
          actions: [
            { type: "logError", params: ({ event }) => event },
            {
              type: "complete",
              params: {
                tag: "err",
                value: { reason: "EXCEPTION", error: null },
              },
            },
          ],
        },

        onDone: {
          actions: [
            {
              type: "complete",
              params: ({ event }) => event.output,
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
      output: ({ context, event }): OTCMakerSignActorOutput => {
        assertEvent(event, "COMPLETE")

        if (event.output.tag === "err") {
          return event.output
        }

        assert(context.nonce !== null)
        const multiPayload = formatSignedIntent(
          event.output.value.signatureResult,
          context.signerCredentials
        )

        return {
          tag: "ok",
          value: {
            multiPayload,
            signatureResult: event.output.value.signatureResult,
            signerCredentials: context.signerCredentials,
            usedNonceBase64: base64.encode(context.nonce),
          },
        }
      },
    },
  },
})
