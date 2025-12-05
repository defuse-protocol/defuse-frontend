import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { getWithdrawQuote } from "@src/components/DefuseSDK/features/machines/1cs"
import { describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"
import type { BaseTokenInfo } from "../../types/base"
import {
  type ParentEvents,
  type WithdrawQuote1csInput,
  background1csWithdrawQuoterMachine,
} from "./background1csWithdrawQuoterMachine"

vi.mock("@src/components/DefuseSDK/features/machines/1cs", () => ({
  getWithdrawQuote: vi.fn(),
}))

type QuoteResult = Awaited<ReturnType<typeof getWithdrawQuote>>

const mockQuoteResponse: QuoteResult = {
  ok: {
    timestamp: new Date().toISOString(),
    signature: "mock-signature",
    quoteRequest: {} as QuoteResult extends { ok: infer O }
      ? O extends { quoteRequest: infer Q }
        ? Q
        : never
      : never,
    quote: {} as QuoteResult extends { ok: infer O }
      ? O extends { quote: infer Q }
        ? Q
        : never
      : never,
  },
}

const mockTokenIn: BaseTokenInfo = {
  defuseAssetId: "nep141:usdc.near",
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  icon: "",
  originChainName: "near",
  deployments: [
    { address: "usdc.near", decimals: 6, chainName: "near", bridge: "direct" },
  ],
}

const mockTokenOut: BaseTokenInfo = {
  defuseAssetId: "eth:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  icon: "",
  originChainName: "eth",
  deployments: [
    {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
      chainName: "eth",
      bridge: "direct",
    },
  ],
}

function createQuoteInput(): WithdrawQuote1csInput {
  return {
    tokenIn: mockTokenIn,
    tokenOut: mockTokenOut,
    amount: { amount: 1000000n, decimals: 6 },
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageBasisPoints: 100,
    defuseUserId: "user.near",
    deadline: new Date(Date.now() + 3600000).toISOString(),
    userAddress: "0x1234567890123456789012345678901234567890",
    userChainType: "evm",
    recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
  }
}

describe("background1csWithdrawQuoterMachine", () => {
  function createParentRef() {
    const parentSend = vi.fn()
    const parentRef = { send: parentSend }
    return { parentSend, parentRef }
  }

  it("emits NEW_1CS_WITHDRAW_QUOTE when receiving NEW_QUOTE_INPUT", async () => {
    vi.mocked(getWithdrawQuote).mockResolvedValueOnce(mockQuoteResponse)
    const { parentSend, parentRef } = createParentRef()

    const actor = createActor(background1csWithdrawQuoterMachine, {
      // @ts-expect-error - using partial mock for parentRef
      input: { parentRef },
    })
    actor.start()

    const quoteInput = createQuoteInput()
    actor.send({ type: "NEW_QUOTE_INPUT", params: quoteInput })

    await vi.waitFor(() => {
      expect(parentSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "NEW_1CS_WITHDRAW_QUOTE",
          params: expect.objectContaining({
            quoteInput,
            tokenInAssetId: mockTokenIn.defuseAssetId,
            tokenOutAssetId: mockTokenOut.defuseAssetId,
          }),
        })
      )
    })

    actor.stop()
  })

  it("ignores stale responses after PAUSE", async () => {
    let resolveQuote: (value: QuoteResult) => void = () => {}
    vi.mocked(getWithdrawQuote).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveQuote = resolve
        })
    )

    const { parentSend, parentRef } = createParentRef()

    const actor = createActor(background1csWithdrawQuoterMachine, {
      // @ts-expect-error - using partial mock for parentRef
      input: { parentRef },
    })
    actor.start()

    actor.send({ type: "NEW_QUOTE_INPUT", params: createQuoteInput() })
    actor.send({ type: "PAUSE" })

    resolveQuote(mockQuoteResponse)
    await new Promise((r) => setTimeout(r, 10))

    expect(parentSend).not.toHaveBeenCalled()

    actor.stop()
  })

  it("ignores stale responses when new quote input is sent", async () => {
    let resolveFirstQuote: (value: QuoteResult) => void = () => {}
    vi.mocked(getWithdrawQuote)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstQuote = resolve
          })
      )
      .mockResolvedValueOnce(mockQuoteResponse)

    const { parentSend, parentRef } = createParentRef()

    const actor = createActor(background1csWithdrawQuoterMachine, {
      // @ts-expect-error - using partial mock for parentRef
      input: { parentRef },
    })
    actor.start()

    const firstInput = createQuoteInput()
    actor.send({ type: "NEW_QUOTE_INPUT", params: firstInput })

    const secondInput = { ...createQuoteInput(), recipient: "0xnewrecipient" }
    actor.send({ type: "NEW_QUOTE_INPUT", params: secondInput })

    resolveFirstQuote(mockQuoteResponse)

    await vi.waitFor(() => {
      expect(parentSend).toHaveBeenCalled()
    })

    const calls = parentSend.mock.calls as [ParentEvents][]
    const quoteEvents = calls.filter(
      ([event]) => event.type === "NEW_1CS_WITHDRAW_QUOTE"
    )
    expect(quoteEvents).toHaveLength(1)
    expect(quoteEvents[0][0].params.quoteInput.recipient).toBe(
      secondInput.recipient
    )

    actor.stop()
  })
})
