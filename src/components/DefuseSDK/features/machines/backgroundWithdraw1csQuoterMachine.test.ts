import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { type InputFrom, createActor, fromTransition } from "xstate"
import type { BaseTokenInfo } from "../../types/base"
import type { WithdrawQuote1csInput } from "./backgroundWithdraw1csQuoterMachine"

vi.mock("./1cs", () => ({
  getWithdrawQuote: vi.fn(),
}))

const { backgroundWithdraw1csQuoterMachine } = await import(
  "./backgroundWithdraw1csQuoterMachine"
)
const { getWithdrawQuote } = await import("./1cs")

const mockedGetWithdrawQuote = vi.mocked(getWithdrawQuote)

type QuoterInput = InputFrom<typeof backgroundWithdraw1csQuoterMachine>
type QuoterParentEvent = Parameters<QuoterInput["parentRef"]["send"]>[0]

const nearUsdcToken: BaseTokenInfo = {
  defuseAssetId: "nep141:usdc.near",
  symbol: "USDC",
  name: "USDC",
  decimals: 6,
  icon: "",
  originChainName: "near",
  deployments: [
    {
      chainName: "near",
      bridge: "direct",
      decimals: 6,
      address: "usdc.near",
    },
  ],
}

const nearNbtcToken: BaseTokenInfo = {
  defuseAssetId: "nep141:nbtc.bridge.near",
  symbol: "nBTC",
  name: "nBTC",
  decimals: 8,
  icon: "",
  originChainName: "near",
  deployments: [
    {
      chainName: "near",
      bridge: "direct",
      decimals: 8,
      address: "nbtc.bridge.near",
    },
  ],
}

function makeQuoteInput(recipient: string): WithdrawQuote1csInput {
  return {
    tokenIn: nearUsdcToken,
    tokenOut: nearUsdcToken,
    amount: { amount: 1_000_000n, decimals: 6 },
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageBasisPoints: 0,
    defuseUserId: "alice.near",
    deadline: new Date(Date.now() + 60_000).toISOString(),
    userAddress: "alice.near",
    userChainType: "near" as const,
    recipient,
    recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
  }
}

function makeQuoteResult(amountOut: string) {
  const quoteRequest: QuoteRequest = {
    dry: true,
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageTolerance: 0,
    originAsset: nearUsdcToken.defuseAssetId,
    depositType: QuoteRequest.depositType.INTENTS,
    destinationAsset: nearUsdcToken.defuseAssetId,
    amount: "1000000",
    refundTo: "alice.near",
    refundType: QuoteRequest.refundType.INTENTS,
    recipient: "alice.near",
    recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    deadline: new Date(Date.now() + 60_000).toISOString(),
  }

  return {
    ok: {
      correlationId: "test-correlation-id",
      timestamp: new Date().toISOString(),
      signature: "test-signature",
      quoteRequest,
      quote: {
        amountIn: "1000000",
        amountInFormatted: "1",
        amountInUsd: "1",
        minAmountIn: "1000000",
        amountOut,
        amountOutFormatted: "0.995",
        amountOutUsd: "0.995",
        minAmountOut: amountOut,
        timeEstimate: 60,
      },
      appFee: [] as [string, bigint][],
    },
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

async function flushMicrotasks() {
  await Promise.resolve()
  await Promise.resolve()
}

function createParentRef(
  onSend?: (event: QuoterParentEvent) => void
): QuoterInput["parentRef"] {
  const actor = createActor(
    fromTransition((state: null, event: QuoterParentEvent) => {
      onSend?.(event)
      return state
    }, null)
  )
  actor.start()
  return actor
}

describe("backgroundWithdraw1csQuoterMachine", () => {
  beforeEach(() => {
    mockedGetWithdrawQuote.mockReset()
  })

  it("emits only latest quote result when multiple requests are inflight", async () => {
    const first = deferred<ReturnType<typeof makeQuoteResult>>()
    const second = deferred<ReturnType<typeof makeQuoteResult>>()

    mockedGetWithdrawQuote
      .mockImplementationOnce(async () => first.promise)
      .mockImplementationOnce(async () => second.promise)

    const parentSend = vi.fn()
    const actor = createActor(backgroundWithdraw1csQuoterMachine, {
      input: {
        parentRef: createParentRef(parentSend),
      },
    }).start()

    actor.send({
      type: "NEW_QUOTE_INPUT",
      params: makeQuoteInput("first.near"),
    })
    actor.send({
      type: "NEW_QUOTE_INPUT",
      params: makeQuoteInput("second.near"),
    })

    expect(mockedGetWithdrawQuote).toHaveBeenCalledTimes(2)
    expect(mockedGetWithdrawQuote).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        dry: true,
        slippageTolerance: 0,
        originAsset: nearUsdcToken.defuseAssetId,
        destinationAsset: nearUsdcToken.defuseAssetId,
        amount: "1000000",
        recipient: "first.near",
        recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
      })
    )
    expect(mockedGetWithdrawQuote).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        dry: true,
        slippageTolerance: 0,
        originAsset: nearUsdcToken.defuseAssetId,
        destinationAsset: nearUsdcToken.defuseAssetId,
        amount: "1000000",
        recipient: "second.near",
        recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
      })
    )

    second.resolve(makeQuoteResult("995000"))
    await flushMicrotasks()

    expect(parentSend).toHaveBeenCalledTimes(1)
    expect(parentSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "NEW_WITHDRAW_1CS_QUOTE",
        params: expect.objectContaining({
          quoteInput: expect.objectContaining({ recipient: "second.near" }),
        }),
      })
    )

    first.resolve(makeQuoteResult("990000"))
    await flushMicrotasks()

    expect(parentSend).toHaveBeenCalledTimes(1)
  })

  it("invalidates inflight requests after PAUSE", async () => {
    const inflight = deferred<ReturnType<typeof makeQuoteResult>>()
    mockedGetWithdrawQuote.mockImplementationOnce(async () => inflight.promise)

    const parentSend = vi.fn()
    const actor = createActor(backgroundWithdraw1csQuoterMachine, {
      input: {
        parentRef: createParentRef(parentSend),
      },
    }).start()

    actor.send({
      type: "NEW_QUOTE_INPUT",
      params: makeQuoteInput("paused.near"),
    })
    actor.send({ type: "PAUSE" })

    inflight.resolve(makeQuoteResult("995000"))
    await flushMicrotasks()

    expect(parentSend).not.toHaveBeenCalled()
  })

  it("invalidates inflight requests when actor is stopped", async () => {
    const inflight = deferred<ReturnType<typeof makeQuoteResult>>()
    mockedGetWithdrawQuote.mockImplementationOnce(async () => inflight.promise)

    const parentSend = vi.fn()
    const actor = createActor(backgroundWithdraw1csQuoterMachine, {
      input: {
        parentRef: createParentRef(parentSend),
      },
    }).start()

    actor.send({
      type: "NEW_QUOTE_INPUT",
      params: makeQuoteInput("stopped.near"),
    })
    actor.stop()

    inflight.resolve(makeQuoteResult("995000"))
    await flushMicrotasks()

    expect(parentSend).not.toHaveBeenCalled()
  })

  it("forwards error message when quote API throws", async () => {
    mockedGetWithdrawQuote.mockRejectedValueOnce(new Error("network down"))

    const parentSend = vi.fn()
    const actor = createActor(backgroundWithdraw1csQuoterMachine, {
      input: {
        parentRef: createParentRef(parentSend),
      },
    }).start()

    actor.send({
      type: "NEW_QUOTE_INPUT",
      params: makeQuoteInput("error.near"),
    })

    await flushMicrotasks()

    expect(parentSend).toHaveBeenCalledTimes(1)
    expect(parentSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "NEW_WITHDRAW_1CS_QUOTE",
        params: expect.objectContaining({
          result: { err: "network down" },
        }),
      })
    )
  })

  it("uses 1cs routing ids for nBTC withdrawal quote", async () => {
    mockedGetWithdrawQuote.mockResolvedValueOnce(makeQuoteResult("995000"))

    const parentSend = vi.fn()
    const actor = createActor(backgroundWithdraw1csQuoterMachine, {
      input: {
        parentRef: createParentRef(parentSend),
      },
    }).start()

    actor.send({
      type: "NEW_QUOTE_INPUT",
      params: {
        ...makeQuoteInput("btc-destination"),
        tokenIn: nearNbtcToken,
        tokenOut: nearNbtcToken,
      },
    })

    await flushMicrotasks()

    expect(mockedGetWithdrawQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        originAsset: "nep141:nbtc.bridge.near",
        destinationAsset: "1cs_v1:btc:native:coin",
      })
    )
  })
})
