import type { MultiPayload } from "@defuse-protocol/contract-types"
import { solverRelay } from "@defuse-protocol/internal-utils"
import { authIdentity } from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"
import { bridgeSDK } from "@src/components/DefuseSDK/constants/bridgeSdk"
import { useMutation } from "@tanstack/react-query"
import { Err, type Result } from "@thames/monads"
import { useContext } from "react"
import {
  type SignerCredentials,
  formatSignedIntent,
} from "../../../core/formatters"
import { createSwapIntentMessage, minutesFromNow } from "../../../core/messages"
import {
  type PublishIntentsErr,
  convertPublishIntentsToLegacyFormat,
} from "../../../sdk/solverRelay/publishIntents"
import { emitEvent } from "../../../services/emitter"
import { assert } from "../../../utils/assert"
import {
  SignIntentContext,
  type SignIntentErr,
} from "../providers/SignIntentActorProvider"
import { otcTakerTradesStore } from "../stores/otcTakerTrades"
import type { SignMessage } from "../types/sharedTypes"
import {
  type AggregatedQuoteErr,
  getFreshQuoteHashes,
} from "../utils/quoteUtils"
import type { OTCTakerPreparationOk } from "./useOtcTakerPreparation"

export function useOtcTakerConfirmTrade({
  tradeId,
  makerMultiPayload,
  signMessage,
  onSuccessTrade,
  referral,
}: {
  tradeId: string
  makerMultiPayload: MultiPayload
  signMessage: SignMessage
  onSuccessTrade: (arg: { intentHashes: string[] }) => void
  referral: string | undefined
}) {
  const { signIntent } = useContext(SignIntentContext)

  return useMutation({
    mutationKey: ["confirm_swap"],
    mutationFn: async ({
      signerCredentials,
      preparation,
    }: {
      signerCredentials: SignerCredentials
      preparation: OTCTakerPreparationOk
    }): Promise<
      Result<
        {
          intentHashes: string[]
          makerMultiPayload: MultiPayload
          takerMultiPayload: MultiPayload
        },
        PublishIntentsErr | SignIntentErr | AggregatedQuoteErr
      >
    > => {
      const signerId = authIdentity.authHandleToIntentsUserId(
        signerCredentials.credential,
        signerCredentials.credentialType
      )

      const { quotes, quoteParams, tokenDelta } = preparation
      const { nonce, deadline } = await bridgeSDK
        .intentBuilder()
        .setDeadline(new Date(minutesFromNow(5)))
        .build()

      const walletMessage = createSwapIntentMessage(tokenDelta, {
        signerId,
        referral,
        memo: "OTC_FILL",
        nonce: base64.decode(nonce),
        deadlineTimestamp: Date.parse(deadline),
      })

      const signatureResult = await signIntent({
        signerCredentials,
        signMessage,
        walletMessage,
      })
      if (signatureResult.isErr()) {
        return Err(signatureResult.unwrapErr())
      }

      // todo: UI performance: add re-quoting in the background
      // It's totally alright do async stuff after singing
      const quoteHashesResult = await getFreshQuoteHashes(quotes, quoteParams, {
        logBalanceSufficient: true,
      })
      if (quoteHashesResult.isErr()) {
        return Err(quoteHashesResult.unwrapErr())
      }

      const multiPayload = formatSignedIntent(
        signatureResult.unwrap().signatureResult,
        signerCredentials
      )

      const result = await solverRelay
        .publishIntents({
          quote_hashes: quoteHashesResult.unwrap(),
          signed_datas: [multiPayload, makerMultiPayload],
        })
        .then(convertPublishIntentsToLegacyFormat)

      return result.map((intentHashes) => {
        return {
          intentHashes,
          makerMultiPayload,
          takerMultiPayload: multiPayload,
        }
      })
    },

    onSuccess: (data, _variables) => {
      data.map((output) => {
        onSuccessTrade(output)
        otcTakerTradesStore.getState().addCompletedTrade({
          tradeId,
          ...output,
        })
        return null
      })

      if (data.isOk()) {
        const trade = otcTakerTradesStore.getState().trades[tradeId]
        assert(trade != null)
        assert(trade.status === "completed")

        emitEvent("otc_confirmed", {
          success: true,
        })
      }
    },
  })
}
