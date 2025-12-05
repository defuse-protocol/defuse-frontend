import type { walletMessage } from "@defuse-protocol/internal-utils"
import {
  QuoteRequest,
  type QuoteResponse,
} from "@defuse-protocol/one-click-sdk-typescript"
import { getWithdrawQuote } from "@src/components/DefuseSDK/features/machines/1cs"
import { Err, Ok } from "@thames/monads"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createActor, fromPromise } from "xstate"
import type { BaseTokenInfo } from "../../types/base"
import {
  type Output,
  withdrawIntent1csMachine,
} from "./withdrawIntent1csMachine"

vi.mock("@src/components/DefuseSDK/features/machines/1cs", () => ({
  getWithdrawQuote: vi.fn(),
}))

vi.mock("@defuse-protocol/internal-utils", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@defuse-protocol/internal-utils")>()
  return {
    ...actual,
    solverRelay: {
      publishIntent: vi.fn(),
    },
    withTimeout: vi.fn((fn) => fn()),
  }
})

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

function createMockQuoteResponse(overrides?: Partial<QuoteResponse["quote"]>): {
  ok: QuoteResponse
} {
  return {
    ok: {
      timestamp: new Date().toISOString(),
      signature: "mock-signature",
      quoteRequest: {} as QuoteResponse["quoteRequest"],
      quote: {
        depositAddress: "deposit-address-123",
        amountIn: "1000000",
        amountInFormatted: "1.0",
        amountInUsd: "1.0",
        minAmountIn: "990000",
        amountOut: "990000",
        amountOutFormatted: "0.99",
        amountOutUsd: "0.99",
        minAmountOut: "980000",
        deadline: new Date(Date.now() + 3600000).toISOString(),
        timeEstimate: 60,
        ...overrides,
      },
    },
  }
}

function createMockInput() {
  return {
    tokenIn: mockTokenIn,
    tokenOut: mockTokenOut,
    amountInTokenBalance: 10000000n,
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageBasisPoints: 100,
    defuseUserId: "user.near",
    deadline: new Date(Date.now() + 3600000).toISOString(),
    userAddress: "0x1234567890123456789012345678901234567890",
    userChainType: "evm" as const,
    nearClient: {} as never,
    amountIn: { amount: 1000000n, decimals: 6 },
    amountOut: { amount: 990000n, decimals: 6 },
    previousOppositeAmount: { amount: 990000n, decimals: 6 },
    recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
  }
}

function createMockSignature(): walletMessage.WalletSignatureResult {
  return {
    type: "ERC191",
    signatureData: "0xmocksignature",
    signedData: { message: "mock-message" },
  }
}

describe("withdrawIntent1csMachine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("happy path", () => {
    it("completes withdrawal flow successfully", async () => {
      const mockQuote = createMockQuoteResponse()
      vi.mocked(getWithdrawQuote).mockResolvedValue(mockQuote)

      const { solverRelay } = await import("@defuse-protocol/internal-utils")
      vi.mocked(solverRelay.publishIntent).mockResolvedValue(
        Ok("intent-hash-123")
      )

      const actor = createActor(
        withdrawIntent1csMachine.provide({
          actors: {
            // @ts-expect-error - mock actor type mismatch
            signMessage: fromPromise(async () => createMockSignature()),
            verifySignatureActor: fromPromise(async () => true),
            // @ts-expect-error - mock actor type mismatch
            publicKeyVerifierActor: fromPromise(async () => ({
              tag: "ok" as const,
            })),
          },
        }),
        { input: createMockInput() }
      )

      const completionPromise = new Promise<Output>((resolve) => {
        actor.subscribe((state) => {
          if (state.status === "done") {
            resolve(state.output)
          }
        })
      })

      actor.start()
      const output = await completionPromise

      expect(output.tag).toBe("ok")
      if (output.tag === "ok") {
        expect(output.value.intentHash).toBe("intent-hash-123")
        expect(output.value.depositAddress).toBe("deposit-address-123")
        expect(output.value.intentDescription.type).toBe("withdraw_1cs")
        expect(output.value.intentDescription.recipient).toBe(
          "0xabcdef1234567890abcdef1234567890abcdef12"
        )
      }
    })
  })

  describe("quote failures", () => {
    it("transitions to Error when quote fails", async () => {
      vi.mocked(getWithdrawQuote).mockResolvedValue({
        err: "Quote unavailable",
      })

      const actor = createActor(withdrawIntent1csMachine, {
        input: createMockInput(),
      })

      const completionPromise = new Promise<Output>((resolve) => {
        actor.subscribe((state) => {
          if (state.status === "done") {
            resolve(state.output)
          }
        })
      })

      actor.start()
      const output = await completionPromise

      expect(output.tag).toBe("err")
      if (output.tag === "err") {
        expect(output.value.reason).toBe("ERR_1CS_QUOTE_FAILED")
      }
    })

    it("transitions to Error when quote has no deposit address", async () => {
      const mockQuote = createMockQuoteResponse({ depositAddress: undefined })
      vi.mocked(getWithdrawQuote).mockResolvedValue(mockQuote)

      const actor = createActor(withdrawIntent1csMachine, {
        input: createMockInput(),
      })

      const completionPromise = new Promise<Output>((resolve) => {
        actor.subscribe((state) => {
          if (state.status === "done") {
            resolve(state.output)
          }
        })
      })

      actor.start()
      const output = await completionPromise

      expect(output.tag).toBe("err")
      if (output.tag === "err") {
        expect(output.value.reason).toBe("ERR_NO_DEPOSIT_ADDRESS")
      }
    })
  })

  describe("insufficient balance for exact-out", () => {
    it("transitions to Error when balance insufficient for exact-out quote", async () => {
      const mockQuote = createMockQuoteResponse({ amountIn: "20000000" })
      vi.mocked(getWithdrawQuote).mockResolvedValue(mockQuote)

      const input = {
        ...createMockInput(),
        swapType: QuoteRequest.swapType.EXACT_OUTPUT,
        amountInTokenBalance: 10000000n,
      }

      const actor = createActor(withdrawIntent1csMachine, { input })

      const completionPromise = new Promise<Output>((resolve) => {
        actor.subscribe((state) => {
          if (state.status === "done") {
            resolve(state.output)
          }
        })
      })

      actor.start()
      const output = await completionPromise

      expect(output.tag).toBe("err")
      if (output.tag === "err") {
        expect(output.value.reason).toBe(
          "ERR_AMOUNT_IN_BALANCE_INSUFFICIENT_AFTER_NEW_1CS_QUOTE"
        )
      }
    })
  })

  describe("price change confirmation", () => {
    it("requests confirmation when price is worse than previous", async () => {
      const mockQuote = createMockQuoteResponse({ amountOut: "800000" })
      vi.mocked(getWithdrawQuote).mockResolvedValue(mockQuote)

      const parentSend = vi.fn()
      const input = {
        ...createMockInput(),
        previousOppositeAmount: { amount: 990000n, decimals: 6 },
        parentRef: { send: parentSend },
      }

      const actor = createActor(withdrawIntent1csMachine, { input })
      actor.start()

      await vi.waitFor(() => {
        expect(parentSend).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "PRICE_CHANGE_CONFIRMATION_REQUEST",
          })
        )
      })

      actor.stop()
    })

    it("proceeds after price change confirmation", async () => {
      const mockQuote = createMockQuoteResponse({ amountOut: "800000" })
      vi.mocked(getWithdrawQuote).mockResolvedValue(mockQuote)

      const { solverRelay } = await import("@defuse-protocol/internal-utils")
      vi.mocked(solverRelay.publishIntent).mockResolvedValue(
        Ok("intent-hash-123")
      )

      const parentSend = vi.fn()
      const input = {
        ...createMockInput(),
        previousOppositeAmount: { amount: 990000n, decimals: 6 },
        parentRef: { send: parentSend },
      }

      const actor = createActor(
        withdrawIntent1csMachine.provide({
          actors: {
            // @ts-expect-error - mock actor type mismatch
            signMessage: fromPromise(async () => createMockSignature()),
            verifySignatureActor: fromPromise(async () => true),
            // @ts-expect-error - mock actor type mismatch
            publicKeyVerifierActor: fromPromise(async () => ({
              tag: "ok" as const,
            })),
          },
        }),
        { input }
      )

      const completionPromise = new Promise<Output>((resolve) => {
        actor.subscribe((state) => {
          if (state.status === "done") {
            resolve(state.output)
          }
        })
      })

      actor.start()

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe(
          "AwaitingPriceChangeConfirmation"
        )
      })

      actor.send({ type: "PRICE_CHANGE_CONFIRMED" })

      const output = await completionPromise
      expect(output.tag).toBe("ok")
    })

    it("cancels when price change is rejected", async () => {
      const mockQuote = createMockQuoteResponse({ amountOut: "800000" })
      vi.mocked(getWithdrawQuote).mockResolvedValue(mockQuote)

      const input = {
        ...createMockInput(),
        previousOppositeAmount: { amount: 990000n, decimals: 6 },
      }

      const actor = createActor(withdrawIntent1csMachine, { input })

      const completionPromise = new Promise<Output>((resolve) => {
        actor.subscribe((state) => {
          if (state.status === "done") {
            resolve(state.output)
          }
        })
      })

      actor.start()

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe(
          "AwaitingPriceChangeConfirmation"
        )
      })

      actor.send({ type: "PRICE_CHANGE_CANCELLED" })

      const output = await completionPromise
      expect(output.tag).toBe("err")
      if (output.tag === "err") {
        expect(output.value.reason).toBe("ERR_WALLET_CANCEL_ACTION")
      }
    })
  })

  describe("signing failures", () => {
    it("transitions to Error when user rejects signing", async () => {
      const mockQuote = createMockQuoteResponse()
      vi.mocked(getWithdrawQuote).mockResolvedValue(mockQuote)

      const actor = createActor(
        withdrawIntent1csMachine.provide({
          actors: {
            // @ts-expect-error - mock actor type mismatch
            signMessage: fromPromise(async () => {
              throw new Error("User rejected")
            }),
          },
        }),
        { input: createMockInput() }
      )

      const completionPromise = new Promise<Output>((resolve) => {
        actor.subscribe((state) => {
          if (state.status === "done") {
            resolve(state.output)
          }
        })
      })

      actor.start()
      const output = await completionPromise

      expect(output.tag).toBe("err")
      if (output.tag === "err") {
        expect(output.value.reason).toBe("ERR_USER_DIDNT_SIGN")
      }
    })
  })

  describe("broadcast failures", () => {
    it("transitions to Error when broadcast fails", async () => {
      const mockQuote = createMockQuoteResponse()
      vi.mocked(getWithdrawQuote).mockResolvedValue(mockQuote)

      const { solverRelay } = await import("@defuse-protocol/internal-utils")
      vi.mocked(solverRelay.publishIntent).mockResolvedValue(
        Err({ code: "INTERNAL_ERROR", message: "Intent rejected" }) as never
      )

      const actor = createActor(
        withdrawIntent1csMachine.provide({
          actors: {
            // @ts-expect-error - mock actor type mismatch
            signMessage: fromPromise(async () => createMockSignature()),
            verifySignatureActor: fromPromise(async () => true),
            // @ts-expect-error - mock actor type mismatch
            publicKeyVerifierActor: fromPromise(async () => ({
              tag: "ok" as const,
            })),
          },
        }),
        { input: createMockInput() }
      )

      const completionPromise = new Promise<Output>((resolve) => {
        actor.subscribe((state) => {
          if (state.status === "done") {
            resolve(state.output)
          }
        })
      })

      actor.start()
      const output = await completionPromise

      expect(output.tag).toBe("err")
      if (output.tag === "err") {
        expect(output.value.reason).toBe("ERR_CANNOT_PUBLISH_INTENT")
      }
    })
  })
})
