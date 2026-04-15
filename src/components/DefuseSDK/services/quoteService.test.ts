import { afterEach, describe, expect, it, vi } from "vitest"
import { getInternalQuote } from "../features/machines/1cs"
import type { BaseTokenInfo } from "../types/base"
import { adjustDecimals } from "../utils/tokenUtils"
import { queryQuote } from "./quoteService"

vi.mock("../features/machines/1cs", () => ({
  getInternalQuote: vi.fn(),
}))

const tokenInfo: BaseTokenInfo = {
  defuseAssetId: "",
  symbol: "",
  name: "",
  decimals: 0,
  icon: "",
  originChainName: "eth",
  deployments: [
    {
      chainName: "eth",
      bridge: "poa",
      decimals: 0,
      address: "",
    },
  ],
}

const token1 = { ...tokenInfo, defuseAssetId: "token1", decimals: 6 }
const token2 = { ...tokenInfo, defuseAssetId: "token2", decimals: 8 }
const token3 = { ...tokenInfo, defuseAssetId: "token3", decimals: 18 }
const tokenOut = { ...tokenInfo, defuseAssetId: "tokenOut" }

// biome-ignore lint/suspicious/noExplicitAny: partial SDK type for tests
function makeQuoteResponse(amountIn: string, amountOut: string): any {
  return {
    quote: {
      amountIn,
      amountOut,
      amountInFormatted: amountIn,
      amountOutFormatted: amountOut,
      amountInUsd: "0",
      amountOutUsd: "0",
      timeEstimate: 30,
    },
  }
}

describe("queryQuote()", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns ERR_UNFULFILLABLE_AMOUNT when balance is less than requested", async () => {
    const input = {
      tokensIn: [token1],
      tokenOut,
      amountIn: { amount: adjustDecimals(150n, 0, 6), decimals: 6 },
      balances: { token1: adjustDecimals(100n, 0, 6) },
      waitMs: 0,
      appFeeBps: 0,
    }

    const result = await queryQuote(input)

    expect(getInternalQuote).not.toHaveBeenCalled()
    expect(result).toEqual({
      tag: "err",
      value: {
        reason: "ERR_UNFULFILLABLE_AMOUNT",
        shortfall: expect.objectContaining({ amount: expect.any(BigInt) }),
        overage: null,
      },
    })
  })

  it("splits amount across tokens if user has enough funds", async () => {
    const input = {
      tokensIn: [token1, token2, token3],
      tokenOut,
      amountIn: { amount: adjustDecimals(150n, 0, 6), decimals: 6 },
      balances: {
        token1: adjustDecimals(100n, 0, token1.decimals),
        token2: adjustDecimals(100n, 0, token2.decimals),
        token3: adjustDecimals(100n, 0, token3.decimals),
      },
      waitMs: 0,
      appFeeBps: 0,
    }

    vi.mocked(getInternalQuote)
      .mockResolvedValueOnce(makeQuoteResponse("100000000", "20"))
      .mockResolvedValueOnce(makeQuoteResponse("5000000000", "10"))

    const result = await queryQuote(input)

    expect(getInternalQuote).toHaveBeenCalledTimes(2)
    expect(getInternalQuote).toHaveBeenCalledWith({
      originAsset: "token1",
      destinationAsset: "tokenOut",
      amount: "100000000",
      quoteWaitingTimeMs: 0,
    })
    expect(getInternalQuote).toHaveBeenCalledWith({
      originAsset: "token2",
      destinationAsset: "tokenOut",
      amount: "5000000000",
      quoteWaitingTimeMs: 0,
    })
    expect(result).toEqual({
      tag: "ok",
      value: {
        quoteHashes: [],
        expirationTime: expect.any(String),
        tokenDeltas: [
          ["token1", -100000000n],
          ["tokenOut", 20n],
          ["token2", -5000000000n],
          ["tokenOut", 10n],
        ],
        appFee: [],
        timeEstimate: 30,
      },
    })
  })

  it("returns ERR_NO_QUOTES when the quote API fails", async () => {
    const input = {
      tokensIn: [token1],
      tokenOut,
      amountIn: { amount: adjustDecimals(150n, 0, 6), decimals: 6 },
      balances: { token1: adjustDecimals(150n, 0, token1.decimals) },
      waitMs: 0,
      appFeeBps: 0,
    }

    vi.mocked(getInternalQuote).mockRejectedValueOnce(new Error("No liquidity"))

    await expect(queryQuote(input)).resolves.toEqual({
      tag: "err",
      value: { reason: "ERR_NO_QUOTES" },
    })
  })

  it("returns ERR_NO_QUOTES if any split leg has no quote", async () => {
    const input = {
      tokensIn: [token1, token2],
      tokenOut,
      amountIn: { amount: adjustDecimals(150n, 0, 6), decimals: 6 },
      balances: {
        token1: adjustDecimals(100n, 0, token1.decimals),
        token2: adjustDecimals(100n, 0, token2.decimals),
      },
      waitMs: 0,
      appFeeBps: 0,
    }

    vi.mocked(getInternalQuote)
      .mockResolvedValueOnce(makeQuoteResponse("100000000", "20"))
      .mockRejectedValueOnce(new Error("No liquidity"))

    await expect(queryQuote(input)).resolves.toEqual({
      tag: "err",
      value: { reason: "ERR_NO_QUOTES" },
    })
  })

  it("correctly handles duplicate input tokens", async () => {
    const input = {
      tokensIn: [token1, token1], // Duplicate token
      tokenOut,
      amountIn: { amount: adjustDecimals(100n, 0, 6), decimals: 6 },
      balances: { token1: adjustDecimals(100n, 0, token1.decimals) },
      waitMs: 0,
      appFeeBps: 0,
    }

    vi.mocked(getInternalQuote).mockResolvedValueOnce(
      makeQuoteResponse("100000000", "200")
    )

    const result = await queryQuote(input)

    expect(getInternalQuote).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      tag: "ok",
      value: {
        quoteHashes: [],
        expirationTime: expect.any(String),
        tokenDeltas: [
          ["token1", -100000000n],
          ["tokenOut", 200n],
        ],
        appFee: [],
        timeEstimate: 30,
      },
    })
  })
})
