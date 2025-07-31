import { solverRelay } from "@defuse-protocol/internal-utils"
import { useMutation } from "@tanstack/react-query"
import { Err, type Result } from "@thames/monads"
import { useContext } from "react"
import {
  type SignerCredentials,
  formatSignedIntent,
} from "../../../core/formatters"
import { createSwapIntentMessage } from "../../../core/messages"
import {
  type PublishIntentsErr,
  convertPublishIntentsToLegacyFormat,
} from "../../../sdk/solverRelay/publishIntents"
import { emitEvent } from "../../../services/emitter"
import type { MultiPayload } from "../../../types/defuse-contracts-types"
import { assert } from "../../../utils/assert"
import { authHandleToIntentsUserId } from "../../../utils/authIdentity"
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
      const signerId = authHandleToIntentsUserId(
        signerCredentials.credential,
        signerCredentials.credentialType
      )

      const { quotes, quoteParams, tokenDelta } = preparation

      const walletMessage = createSwapIntentMessage(tokenDelta, {
        signerId,
        referral,
        memo: "OTC_FILL",
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
          intent_id: tradeId,
          tx_hash: trade.intentHashes,
          received_amount: _variables.preparation.tokenDelta,
          otc_receiver: _variables.signerCredentials,
        })
      }
    },
  })
}
