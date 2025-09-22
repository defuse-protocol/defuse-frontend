import { solverRelay } from "@defuse-protocol/internal-utils"
import { server } from "@src/tests/setup"
import { http, HttpResponse } from "msw"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { BaseTokenInfo } from "../types/base"
import { adjustDecimals } from "../utils/tokenUtils"
import { queryQuote } from "./quoteService"

vi.mock("@defuse-protocol/internal-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@defuse-protocol/internal-utils")>()),
  solverRelay: {
    getQuote: vi.fn(),
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

describe("queryQuote()", () => {
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

    vi.mocked(solverRelay.getQuote).mockImplementationOnce(async () => ({
      quote_hash: "q1",
      defuse_asset_identifier_in: "token1",
      defuse_asset_identifier_out: "tokenOut",
      amount_in: "150000000",
      amount_out: "200",
      expiration_time: "2024-01-15T12:02:00.000Z",
    }))

    const result = await queryQuote(input)

    expect(solverRelay.getQuote).toHaveBeenCalledTimes(1)
    expect(solverRelay.getQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        quoteParams: {
          defuse_asset_identifier_in: "token1",
          defuse_asset_identifier_out: "tokenOut",
          exact_amount_in: "150000000",
          min_deadline_ms: 60_000,
          wait_ms: 0,
        },
      })
    )
    expect(result).toEqual({
      tag: "ok",
      value: {
        expirationTime: "2024-01-15T12:02:00.000Z",
        quoteHashes: ["q1"],
        tokenDeltas: [
          ["token1", -150000000n],
          ["tokenOut", 200n],
        ],
        appFee: [],
      },
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

    vi.mocked(solverRelay.getQuote)
      .mockImplementationOnce(async () => ({
        quote_hash: "q1",
        defuse_asset_identifier_in: "token1",
        defuse_asset_identifier_out: "tokenOut",
        amount_in: "100000000",
        amount_out: "20",
        expiration_time: "2024-01-15T12:02:00.000Z",
      }))
      .mockImplementationOnce(async () => ({
        quote_hash: "q2",
        defuse_asset_identifier_in: "token2",
        defuse_asset_identifier_out: "tokenOut",
        amount_in: "5000000000",
        amount_out: "10",
        expiration_time: "2024-01-15T12:01:30.000Z",
      }))

    const result = await queryQuote(input)

    expect(solverRelay.getQuote).toHaveBeenCalledTimes(2)
    expect(solverRelay.getQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        quoteParams: {
          defuse_asset_identifier_in: "token1",
          defuse_asset_identifier_out: "tokenOut",
          exact_amount_in: "100000000",
          min_deadline_ms: 60_000,
          wait_ms: 0,
        },
      })
    )
    expect(solverRelay.getQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        quoteParams: {
          defuse_asset_identifier_in: "token2",
          defuse_asset_identifier_out: "tokenOut",
          exact_amount_in: "5000000000",
          min_deadline_ms: 60_000,
          wait_ms: 0,
        },
      })
    )
    expect(result).toEqual({
      tag: "ok",
      value: {
        expirationTime: "2024-01-15T12:01:30.000Z",
        quoteHashes: ["q1", "q2"],
        tokenDeltas: [
          ["token1", -100000000n],
          ["tokenOut", 20n],
          ["token2", -5000000000n],
          ["tokenOut", 10n],
        ],
        appFee: [],
      },
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

    // Use the original function for this test case
    vi.mocked(solverRelay.getQuote).mockImplementationOnce(async (...args) => {
      const actual = await vi.importActual<
        typeof import("@defuse-protocol/internal-utils")
      >("@defuse-protocol/internal-utils")
      return actual.solverRelay.getQuote(...args)
    })

    server.use(
      http.post("https://solver-relay-v2.chaindefuser.com/rpc", async () => {
        return HttpResponse.json({
          id: "dontcare",
          jsonrpc: "2.0",
          result: [
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
          ],
        })
      })
    )

    const result = await queryQuote(input)

    expect(result).toEqual({
      tag: "ok",
      value: {
        expirationTime: "2024-01-15T12:02:00.000Z",
        quoteHashes: ["q2"],
        tokenDeltas: [
          ["token1", -150n],
          ["tokenOut", 200n],
        ],
        appFee: [],
      },
    })
  })

  it("returns empty result if quote is null", async () => {
    const input = {
      tokensIn: [token1],
      tokenOut: tokenOut,
      amountIn: { amount: adjustDecimals(150n, 0, 6), decimals: 6 },
      balances: { token1: adjustDecimals(100n, 0, token1.decimals) },
      waitMs: 0,
      appFeeBps: 0,
    }

    // Use the original function for this test case
    vi.mocked(solverRelay.getQuote)
      .mockImplementationOnce(async (...args) => {
        const actual = await vi.importActual<
          typeof import("@defuse-protocol/internal-utils")
        >("@defuse-protocol/internal-utils")
        return actual.solverRelay.getQuote(...args)
      })
      .mockImplementationOnce(async (...args) => {
        const actual = await vi.importActual<
          typeof import("@defuse-protocol/internal-utils")
        >("@defuse-protocol/internal-utils")
        return actual.solverRelay.getQuote(...args)
      })

    server.use(
      http.post("https://solver-relay-v2.chaindefuser.com/rpc", function* () {
        yield HttpResponse.json({
          id: "dontcare",
          jsonrpc: "2.0",
          result: [],
        })

        return HttpResponse.json({
          id: "dontcare",
          jsonrpc: "2.0",
          result: null,
        })
      })
    )

    await expect(queryQuote(input)).resolves.toEqual({
      tag: "err",
      value: {
        reason: "ERR_NO_QUOTES",
      },
    })

    await expect(queryQuote(input)).resolves.toEqual({
      tag: "err",
      value: {
        reason: "ERR_NO_QUOTES",
      },
    })
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

    // Use the original function for this test case
    vi.mocked(solverRelay.getQuote)
      .mockImplementationOnce(async (...args) => {
        const actual = await vi.importActual<
          typeof import("@defuse-protocol/internal-utils")
        >("@defuse-protocol/internal-utils")
        return actual.solverRelay.getQuote(...args)
      })
      .mockImplementationOnce(async (...args) => {
        const actual = await vi.importActual<
          typeof import("@defuse-protocol/internal-utils")
        >("@defuse-protocol/internal-utils")
        return actual.solverRelay.getQuote(...args)
      })

    const queue = [
      {
        id: "dontcare",
        jsonrpc: "2.0",
        result: [
          {
            quote_hash: "q1",
            defuse_asset_identifier_in: "token1",
            defuse_asset_identifier_out: "tokenOut",
            amount_in: "100",
            amount_out: "20",
            expiration_time: "2024-01-15T12:02:00.000Z",
          },
        ],
      },
      {
        id: "dontcare",
        jsonrpc: "2.0",
        result: null,
      },
    ]
    server.use(
      http.post("https://solver-relay-v2.chaindefuser.com/rpc", function* () {
        while (queue.length > 0) {
          yield HttpResponse.json(queue.shift())
        }
        throw "out of responses"
      })
    )

    await expect(queryQuote(input)).resolves.toEqual({
      tag: "ok",
      value: {
        quoteHashes: ["q1"],
        expirationTime: "2024-01-15T12:02:00.000Z",
        tokenDeltas: [
          ["token1", -100n],
          ["tokenOut", 20n],
        ],
        appFee: [],
      },
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

    vi.mocked(solverRelay.getQuote).mockImplementationOnce(async () => ({
      quote_hash: "q1",
      defuse_asset_identifier_in: "token1",
      defuse_asset_identifier_out: "tokenOut",
      amount_in: "150",
      amount_out: "200",
      expiration_time: "2024-01-15T12:02:00.000Z",
    }))

    const result = await queryQuote(input)

    expect(solverRelay.getQuote).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      tag: "ok",
      value: {
        expirationTime: expect.any(String),
        quoteHashes: ["q1"],
        tokenDeltas: [
          ["token1", -150n],
          ["tokenOut", 200n],
        ],
        appFee: [],
      },
    })
  })
})
