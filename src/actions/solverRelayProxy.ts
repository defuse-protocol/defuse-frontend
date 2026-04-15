"use server"

import type { MultiPayload } from "@defuse-protocol/contract-types"
import { solverRelay } from "@defuse-protocol/internal-utils"
import { SolverRelayProxyError } from "@src/components/DefuseSDK/errors/solverRelayProxy"
import { assert } from "@src/components/DefuseSDK/utils/assert"
import { INTENTS_API_KEY, INTENTS_ENV } from "@src/utils/environment"

function getSolverRelayBaseURL(): string {
  return INTENTS_ENV === "production"
    ? "https://solver-relay-v2.chaindefuser.com/"
    : "https://solver-relay-stage.intents-near.org/"
}

function serverConfig() {
  return {
    baseURL: getSolverRelayBaseURL(),
    solverRelayApiKey: INTENTS_API_KEY ?? undefined,
  }
}

export type PublishIntentInput = {
  multiPayload: MultiPayload
  quoteHashes: string[]
}

/**
 * Publishes a single intent via the solver relay.
 * Accepts a pre-prepared MultiPayload (all strings, no binary data)
 * so that Uint8Array fields don't break server action serialization.
 *
 * Callers must call `prepareBroadcastRequest.prepareSwapSignedData()`
 * on the client side before invoking this server action.
 *
 * Returns { ok: string } | { err: { code: string } } (serializable).
 */
export async function solverRelayPublishIntent(input: PublishIntentInput) {
  try {
    const result = await solverRelay.publishIntents(
      {
        signed_datas: [input.multiPayload],
        quote_hashes: input.quoteHashes,
      },
      serverConfig()
    )
    if (result.isOk()) {
      const intentHash = result.unwrap()[0]
      assert(intentHash != null, "Should include at least one intent hash")
      return { ok: intentHash } as const
    }
    // Extract only the serializable code — Error instances don't survive the
    // server action boundary reliably (class properties may be stripped).
    return { err: { code: result.unwrapErr().code } } as const
  } catch (error) {
    throw new SolverRelayProxyError("publishIntent failed", error)
  }
}

export type PublishIntentsInput = {
  quote_hashes: string[]
  signed_datas: MultiPayload[]
}

/**
 * Returns { ok: string[] } | { err: { code: string } } (serializable).
 */
export async function solverRelayPublishIntents(input: PublishIntentsInput) {
  try {
    const result = await solverRelay.publishIntents(input, serverConfig())
    if (result.isOk()) {
      return { ok: result.unwrap() } as const
    }
    return { err: { code: result.unwrapErr().code } } as const
  } catch (error) {
    throw new SolverRelayProxyError("publishIntents failed", error)
  }
}

export type GetStatusInput = {
  intentHash: string
}

/**
 * Returns the current intent status (PENDING, TX_BROADCASTED, SETTLED, NOT_FOUND_OR_NOT_VALID).
 * Use this for polling — it returns immediately with the current state,
 * unlike waitForSettlement which blocks until settled.
 */
export async function solverRelayGetStatus(input: GetStatusInput) {
  try {
    return await solverRelay.getStatus(
      { intent_hash: input.intentHash },
      serverConfig()
    )
  } catch (error) {
    throw new SolverRelayProxyError(
      `getStatus failed (intent: ${input.intentHash})`,
      error
    )
  }
}

export type WaitForSettlementInput = {
  intentHash: string
}

/**
 * Returns { txHash: string; intentHash: string }.
 * Note: AbortSignal cannot be passed through server actions.
 * The function runs until settlement completes or the intent fails terminally.
 * Vercel's function timeout provides the natural upper bound.
 */
export async function solverRelayWaitForSettlement(
  input: WaitForSettlementInput
) {
  try {
    return await solverRelay.waitForIntentSettlement({
      intentHash: input.intentHash,
      ...serverConfig(),
    })
  } catch (error) {
    throw new SolverRelayProxyError(
      `waitForSettlement failed (intent: ${input.intentHash})`,
      error
    )
  }
}
