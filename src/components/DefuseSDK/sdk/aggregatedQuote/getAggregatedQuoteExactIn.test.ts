import { QuoteError, solverRelay } from "@defuse-protocol/internal-utils"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { BaseTokenInfo } from "../../types/base"
import { adjustDecimals } from "../../utils/tokenUtils"
import { AggregatedQuoteError } from "./errors/aggregatedQuoteError"
import { getAggregatedQuoteExactIn } from "./getAggregatedQuoteExactIn"

vi.mock("@defuse-protocol/internal-utils", () => ({
  solverRelay: {
    quote: vi.fn(),
  },
}))

const tokenInfo: BaseTokenInfo = {
  defuseAssetId: "",
  address: "",
  symbol: "",
  name: "",
  decimals: 0,
  icon: "",
  chainName: "eth",
  bridge: "poa",
}

const token1 = {
  ...tokenInfo,
  defuseAssetId: "token1",
  decimals: 6,
}
const token2 = {
  ...tokenInfo,
  defuseAssetId: "token2",
  decimals: 8,
}
const token3 = {
  ...tokenInfo,
  defuseAssetId: "token3",
  decimals: 18,
}
const tokenOut = {
  ...tokenInfo,
  defuseAssetId: "tokenOut",
}

// We mock low-level `quote()`, but `getQuote()` uses unmocked `quote()` internally.
// Need to use msw to intercept the request and mock the response.
// see: quoteService.test.ts
describe.skip("getAggregatedQuoteExactIn()", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("quotes full amount even if user has less funds than requested", async () => {
    const input = {
      tokensIn: [token1],
      tokenOut: tokenOut,
      amountIn: { amount: adjustDecimals(150n, 0, 6), decimals: 6 },
      balances: { token1: adjustDecimals(100n, 0, 6) },
      waitMs: 0,
      appFeeBps: 0,
    }

    vi.mocked(solverRelay.quote).mockImplementationOnce(async () => [
      {
        quote_hash: "q1",
        defuse_asset_identifier_in: "token1",
        defuse_asset_identifier_out: "tokenOut",
        amount_in: "150000000",
        amount_out: "200",
        expiration_time: "2024-01-15T12:02:00.000Z",
      },
    ])

    const result = await getAggregatedQuoteExactIn({
      aggregatedQuoteParams: input,
    })

    const quoteParams = {
      defuse_asset_identifier_in: "token1",
      defuse_asset_identifier_out: "tokenOut",
      exact_amount_in: "150000000",
      min_deadline_ms: 60_000,
      wait_ms: 0,
    }

    expect(solverRelay.quote).toHaveBeenCalledTimes(1)
    expect(solverRelay.quote).toHaveBeenCalledWith(
      quoteParams,
      expect.any(Object)
    )
    expect(result).toEqual({
      expirationTime: "2024-01-15T12:02:00.000Z",
      quoteHashes: ["q1"],
      tokenDeltas: [
        ["token1", -150000000n],
        ["tokenOut", 200n],
      ],
      appFee: [],
      quoteParams: [quoteParams],
      fillStatus: "FULL",
      isSimulation: true,
    })
  })

  it("splits amount across tokens if user has enough funds", async () => {
    const input = {
      tokensIn: [token1, token2, token3],
      tokenOut: tokenOut,
      amountIn: { amount: adjustDecimals(150n, 0, 6), decimals: 6 },
      balances: {
        token1: adjustDecimals(100n, 0, token1.decimals),
        token2: adjustDecimals(100n, 0, token2.decimals),
        token3: adjustDecimals(100n, 0, token3.decimals),
      },
      waitMs: 0,
      appFeeBps: 0,
    }

    vi.mocked(solverRelay.quote)
      .mockImplementationOnce(async () => [
        {
          quote_hash: "q1",
          defuse_asset_identifier_in: "token1",
          defuse_asset_identifier_out: "tokenOut",
          amount_in: "100000000",
          amount_out: "20",
          expiration_time: "2024-01-15T12:02:00.000Z",
        },
      ])
      .mockImplementationOnce(async () => [
        {
          quote_hash: "q2",
          defuse_asset_identifier_in: "token2",
          defuse_asset_identifier_out: "tokenOut",
          amount_in: "5000000000",
          amount_out: "10",
          expiration_time: "2024-01-15T12:01:30.000Z",
        },
      ])

    const result = await getAggregatedQuoteExactIn({
      aggregatedQuoteParams: input,
    })

    const quoteParams = [
      {
        defuse_asset_identifier_in: "token1",
        defuse_asset_identifier_out: "tokenOut",
        exact_amount_in: "100000000",
        min_deadline_ms: 60_000,
        wait_ms: 0,
      },
      {
        defuse_asset_identifier_in: "token2",
        defuse_asset_identifier_out: "tokenOut",
        exact_amount_in: "5000000000",
        min_deadline_ms: 60_000,
        wait_ms: 0,
      },
    ]

    expect(solverRelay.quote).toHaveBeenCalledTimes(2)
    expect(solverRelay.quote).toHaveBeenCalledWith(
      quoteParams[0],
      expect.any(Object)
    )
    expect(solverRelay.quote).toHaveBeenCalledWith(
      quoteParams[1],
      expect.any(Object)
    )
    expect(result).toEqual({
      expirationTime: "2024-01-15T12:01:30.000Z",
      quoteHashes: ["q1", "q2"],
      tokenDeltas: [
        ["token1", -100000000n],
        ["tokenOut", 20n],
        ["token2", -5000000000n],
        ["tokenOut", 10n],
      ],
      appFee: [],
      quoteParams,
      fillStatus: "FULL",
      isSimulation: false,
    })
  })

  it("takes a quote with the best return", async () => {
    const input = {
      tokensIn: [token1],
      tokenOut: tokenOut,
      amountIn: { amount: adjustDecimals(150n, 0, 6), decimals: 6 },
      balances: { token1: adjustDecimals(100n, 0, token1.decimals) },
      waitMs: 0,
      appFeeBps: 0,
    }

    vi.mocked(solverRelay.quote).mockImplementationOnce(async () => [
      {
        quote_hash: "q1",
        defuse_asset_identifier_in: "token1",
        defuse_asset_identifier_out: "tokenOut",
        amount_in: "150",
        amount_out: "180",
        expiration_time: "2024-01-15T12:00:00.000Z",
      },
      {
        quote_hash: "q2",
        defuse_asset_identifier_in: "token1",
        defuse_asset_identifier_out: "tokenOut",
        amount_in: "150",
        amount_out: "200",
        expiration_time: "2024-01-15T12:02:00.000Z",
      },
      {
        quote_hash: "q3",
        defuse_asset_identifier_in: "token1",
        defuse_asset_identifier_out: "tokenOut",
        amount_in: "150",
        amount_out: "100",
        expiration_time: "2024-01-15T12:01:30.000Z",
      },
    ])

    const result = await getAggregatedQuoteExactIn({
      aggregatedQuoteParams: input,
    })

    expect(result).toEqual({
      expirationTime: "2024-01-15T12:02:00.000Z",
      quoteHashes: ["q2"],
      tokenDeltas: [
        ["token1", -150n],
        ["tokenOut", 200n],
      ],
      appFee: [],
      quoteParams: [
        {
          defuse_asset_identifier_in: "token1",
          defuse_asset_identifier_out: "tokenOut",
          exact_amount_in: "150000000",
          min_deadline_ms: 60000,
          wait_ms: 0,
        },
      ],
      fillStatus: "FULL",
      isSimulation: true,
    })
  })

  it("throws AggregatedQuoteError if quote is null", async () => {
    const input = {
      tokensIn: [token1],
      tokenOut: tokenOut,
      amountIn: { amount: adjustDecimals(150n, 0, 6), decimals: 6 },
      balances: { token1: adjustDecimals(100n, 0, token1.decimals) },
      waitMs: 0,
      appFeeBps: 0,
    }

    vi.mocked(solverRelay.quote)
      .mockImplementationOnce(async () => null)
      .mockImplementationOnce(async () => [])

    await expect(
      getAggregatedQuoteExactIn({ aggregatedQuoteParams: input })
    ).rejects.toBeInstanceOf(AggregatedQuoteError)
    await expect(
      getAggregatedQuoteExactIn({ aggregatedQuoteParams: input })
    ).rejects.toBeInstanceOf(AggregatedQuoteError)
  })

  it("returns partial fill if some quotes are null", async () => {
    const input = {
      tokensIn: [token1, token2],
      tokenOut: tokenOut,
      amountIn: { amount: adjustDecimals(150n, 0, 6), decimals: 6 },
      balances: {
        token1: adjustDecimals(100n, 0, token1.decimals),
        token2: adjustDecimals(100n, 0, token2.decimals),
      },
      waitMs: 0,
      appFeeBps: 0,
    }

    const quoteParams = [
      {
        defuse_asset_identifier_in: "token1",
        defuse_asset_identifier_out: "tokenOut",
        exact_amount_in: "100000000",
        min_deadline_ms: 60000,
        wait_ms: 0,
      },
      {
        defuse_asset_identifier_in: "token2",
        defuse_asset_identifier_out: "tokenOut",
        exact_amount_in: "5000000000",
        min_deadline_ms: 60000,
        wait_ms: 0,
      },
    ]

    vi.mocked(solverRelay.quote)
      .mockImplementationOnce(async () => [
        {
          quote_hash: "q1",
          defuse_asset_identifier_in: "token1",
          defuse_asset_identifier_out: "tokenOut",
          amount_in: "100",
          amount_out: "20",
          expiration_time: "2024-01-15T12:02:00.000Z",
        },
      ])
      .mockImplementationOnce(async () => null)

    await expect(
      getAggregatedQuoteExactIn({
        aggregatedQuoteParams: input,
      })
    ).resolves.toEqual({
      quoteHashes: ["q1"],
      expirationTime: "2024-01-15T12:02:00.000Z",
      tokenDeltas: [
        ["token1", -100n],
        ["tokenOut", 20n],
      ],
      appFee: [],
      quoteParams: [quoteParams[0]],
      isSimulation: false,
      fillStatus: "PARTIAL",
      quoteErrors: [
        new QuoteError({
          quote: null,
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          quoteParams: quoteParams[1]!,
        }),
      ],
    })
  })

  it("correctly handles duplicate input tokens", async () => {
    const input = {
      tokensIn: [token1, token1], // Duplicate token
      tokenOut: tokenOut,
      amountIn: { amount: adjustDecimals(150n, 0, 6), decimals: 6 },
      balances: { token1: adjustDecimals(100n, 0, token1.decimals) },
      waitMs: 0,
      appFeeBps: 0,
    }

    vi.mocked(solverRelay.quote).mockImplementationOnce(async () => [
      {
        quote_hash: "q1",
        defuse_asset_identifier_in: "token1",
        defuse_asset_identifier_out: "tokenOut",
        amount_in: "150",
        amount_out: "200",
        expiration_time: "2024-01-15T12:02:00.000Z",
      },
    ])

    const result = await getAggregatedQuoteExactIn({
      aggregatedQuoteParams: input,
    })

    expect(solverRelay.quote).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      expirationTime: expect.any(String),
      quoteHashes: ["q1"],
      tokenDeltas: [
        ["token1", -150n],
        ["tokenOut", 200n],
      ],
      quoteParams: [
        {
          defuse_asset_identifier_in: "token1",
          defuse_asset_identifier_out: "tokenOut",
          exact_amount_in: "150000000",
          min_deadline_ms: 60000,
          wait_ms: 0,
        },
      ],
      appFee: [],
      isSimulation: true,
      fillStatus: "FULL",
    })
  })
})
