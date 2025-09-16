import { type Mock, afterAll, describe, expect, it, vi } from "vitest"
import type { TokenBalances as TokenBalancesRecord } from "../../../../services/defuseBalanceService"
import type { BaseTokenInfo, TokenValue } from "../../../../types/base"
import type { SwappableToken } from "../../../../types/swap"
import * as tokenUtils from "../../../../utils/token"
import {
  adjustToScale,
  cleanUpDuplicateTokens,
  getBlockchainSelectItems,
  getMinAmountToken,
  getWithdrawButtonText,
  mapDepositBalancesToDecimals,
  prepareAddressToUserBalance,
} from "./utils"

describe("adjustToScale", () => {
  it("returns 0 value and empty postfix for zero amount", () => {
    const token: TokenValue = { amount: 0n, decimals: 18 }
    const result = adjustToScale(token)
    expect(result).toEqual({ value: 0, postfix: "" })
  })

  it("returns unscaled value for value below threshold", () => {
    const token: TokenValue = {
      amount: BigInt(5 * 10 ** 18), // 5 tokens
      decimals: 18,
    }
    const result = adjustToScale(token, 1000)
    expect(result).toEqual({ value: 5, postfix: "" })
  })

  it("returns scaled value for value above threshold", () => {
    const token: TokenValue = {
      amount: BigInt(1500 * 10 ** 18), // 1500 tokens
      decimals: 18,
    }
    const result = adjustToScale(token, 1000)
    expect(result).toEqual({ value: 2, postfix: "k" }) // 1500 / 1000 = 1.5 → rounds to 2
  })

  it("rounds down correctly", () => {
    const token: TokenValue = {
      amount: BigInt(999 * 10 ** 18),
      decimals: 18,
    }
    const result = adjustToScale(token, 1000)
    expect(result).toEqual({ value: 999, postfix: "" })
  })

  it("works with custom threshold", () => {
    const token: TokenValue = {
      amount: BigInt(20000 * 10 ** 6), // token with 6 decimals
      decimals: 6,
    }
    const result = adjustToScale(token, 10000)
    expect(result).toEqual({ value: 2, postfix: "k" }) // 20000 / 10000 = 2
  })

  it("rounds accurately", () => {
    const token: TokenValue = {
      amount: BigInt(1450 * 10 ** 18),
      decimals: 18,
    }
    const result = adjustToScale(token, 1000)
    expect(result).toEqual({ value: 1, postfix: "k" }) // 1450 / 1000 = 1.45 → rounds to 1
  })
})

describe("cleanUpDuplicateTokens", () => {
  vi.mock("../../../../utils/token", () => ({
    isBaseToken: vi.fn(),
  }))

  afterAll(async () => {
    vi.unmock("../../../../utils/token")
    await import("../../../../utils/token")
  })

  const mockBaseToken = (
    overrides: Partial<BaseTokenInfo> = {}
  ): BaseTokenInfo => ({
    chainName: "eth",
    address: "address",
    symbol: "symbol",
    name: "name",
    decimals: 6,
    icon: "icon",
    bridge: "poa",
    defuseAssetId: "ETH",
    ...overrides,
  })

  const mockedIsBaseToken = tokenUtils.isBaseToken as unknown as Mock

  it("returns a single base token wrapped in an array", () => {
    const token = mockBaseToken()
    mockedIsBaseToken.mockReturnValue(true)

    const result = cleanUpDuplicateTokens(token as SwappableToken)
    expect(result).toEqual([token])
  })

  it("filters out tokens with duplicate chainName", () => {
    const token1 = mockBaseToken({ chainName: "eth", defuseAssetId: "ETH" })
    const token2 = mockBaseToken({ chainName: "eth", defuseAssetId: "ETH2" }) // same chainName

    const grouped = { groupedTokens: [token1, token2] } as SwappableToken
    mockedIsBaseToken.mockReturnValue(false)

    const result = cleanUpDuplicateTokens(grouped)
    expect(result).toEqual([token1])
  })

  it("filters out tokens with duplicate defuseAssetId", () => {
    const token1 = mockBaseToken({ chainName: "eth", defuseAssetId: "ETH" })
    const token2 = mockBaseToken({ chainName: "base", defuseAssetId: "ETH" }) // same defuseAssetId

    const grouped = { groupedTokens: [token1, token2] } as SwappableToken
    mockedIsBaseToken.mockReturnValue(false)

    const result = cleanUpDuplicateTokens(grouped)
    expect(result).toEqual([token1])
  })

  it("includes only the first unique token by chain and asset ID", () => {
    const token1 = mockBaseToken({ chainName: "eth", defuseAssetId: "ETH" })
    const token2 = mockBaseToken({ chainName: "base", defuseAssetId: "MATIC" })
    const token3 = mockBaseToken({ chainName: "base", defuseAssetId: "MATIC" }) // duplicate

    const grouped = {
      groupedTokens: [token1, token2, token3],
    } as SwappableToken
    mockedIsBaseToken.mockReturnValue(false)

    const result = cleanUpDuplicateTokens(grouped)
    expect(result).toEqual([token1, token2])
  })
})

describe("prepareAddressToUserBalance", () => {
  const mockToken = (
    defuseAssetId: string,
    decimals: number
  ): BaseTokenInfo => ({
    defuseAssetId,
    decimals,
    symbol: defuseAssetId,
    name: `${defuseAssetId} Token`,
    address: "0x0",
    icon: "",
    chainName: "eth",
    bridge: "direct",
  })

  it("returns correct mapping for tokens with matching balances", () => {
    const tokens: BaseTokenInfo[] = [mockToken("ETH", 18), mockToken("USDC", 6)]

    const balances = {
      ETH: 1000000000000000000n,
      USDC: 1234567n,
    }

    const result = prepareAddressToUserBalance(tokens, balances)

    expect(result).toEqual({
      ETH: { amount: 1000000000000000000n, decimals: 18 },
      USDC: { amount: 1234567n, decimals: 6 },
    })
  })

  it("skips tokens with missing balances", () => {
    const tokens: BaseTokenInfo[] = [mockToken("ETH", 18), mockToken("DAI", 18)]

    const balances = {
      ETH: 1n,
      // DAI is missing
    }

    const result = prepareAddressToUserBalance(tokens, balances)

    expect(result).toEqual({
      ETH: { amount: 1n, decimals: 18 },
    })

    expect(result).not.toHaveProperty("DAI")
  })

  it("returns an empty object if no tokens are provided", () => {
    const result = prepareAddressToUserBalance([], { ETH: 1n })
    expect(result).toEqual({})
  })

  it("returns an empty object if no balances match any token", () => {
    const tokens: BaseTokenInfo[] = [mockToken("ETH", 18)]
    const balances = {} // empty

    const result = prepareAddressToUserBalance(tokens, balances)
    expect(result).toEqual({})
  })

  it("handles large numbers correctly", () => {
    const tokens: BaseTokenInfo[] = [mockToken("BTC", 8)]
    const balances = {
      BTC: 2100000000000000n,
    }

    const result = prepareAddressToUserBalance(tokens, balances)
    expect(result.BTC).toEqual({
      amount: 2100000000000000n,
      decimals: 8,
    })
  })
})

describe("getMinAmountToken", () => {
  const basicTokenValue = {
    amount: 0n,
    decimals: 6,
  }

  it.each([
    { token1: undefined, token2: undefined, expected: undefined },
    {
      token1: { ...basicTokenValue, amount: 0n },
      token2: { ...basicTokenValue, amount: 0n },
      expected: undefined,
    },
    {
      token1: undefined,
      token2: { ...basicTokenValue, amount: 10n },
      expected: { amount: 10n },
    },
    {
      token1: { ...basicTokenValue, amount: 0n },
      token2: { ...basicTokenValue, amount: 15n },
      expected: { amount: 15n },
    },
    {
      token1: { ...basicTokenValue, amount: 20n },
      token2: undefined,
      expected: { ...basicTokenValue, amount: 20n },
    },
    {
      token1: { ...basicTokenValue, amount: 25n },
      token2: { ...basicTokenValue, amount: 0n },
      expected: { amount: 25n },
    },
    {
      token1: { ...basicTokenValue, amount: 5n },
      token2: { ...basicTokenValue, amount: 10n },
      expected: { ...basicTokenValue, amount: 5n },
    },
    {
      token1: { ...basicTokenValue, amount: 20n },
      token2: { ...basicTokenValue, amount: 15n },
      expected: { ...basicTokenValue, amount: 15n },
    },
    {
      token1: { ...basicTokenValue, amount: 30n },
      token2: { ...basicTokenValue, amount: 30n },
      expected: { ...basicTokenValue, amount: 30n },
    },
  ])(
    "token1: $token1, token2: $token2 => expected: $expected",
    ({ token1, token2, expected }) => {
      const result = getMinAmountToken(token1, token2)

      if (expected === undefined) {
        expect(result).toBeUndefined()
      } else {
        expect(result?.amount).toEqual(expected.amount)
      }
    }
  )
})

describe("getWithdrawButtonText", () => {
  it.each([
    // [noLiquidity, insufficientTokenInAmount, expectedText]
    [true, false, "No liquidity providers"],
    [true, true, "No liquidity providers"],
    [false, true, "Insufficient amount"],
    [false, false, "Withdraw"],
  ])(
    'with noLiquidity=%s and insufficientTokenInAmount=%s returns "%s"',
    (noLiquidity, insufficientTokenInAmount, expected) => {
      const result = getWithdrawButtonText(
        noLiquidity,
        insufficientTokenInAmount
      )
      expect(result).toBe(expected)
    }
  )
})

describe.skip("mapDepositBalancesToDecimals", () => {
  // todo: vi.mock breaks usage utils in other tests, unskip when fixed
  // vi.mock("../../../../utils/token", () => ({
  //   isBaseToken: vi.fn(), // Mock the function
  // }))
  const mockedIsBaseToken = tokenUtils.isBaseToken as unknown as Mock
  const baseToken: BaseTokenInfo = {
    defuseAssetId: "defuseAssetId",
    address: "address",
    symbol: "symbol",
    name: "name",
    decimals: 6,
    icon: "icon",
    chainName: "eth",
    bridge: "poa",
  }

  const unifiedToken = {
    unifiedAssetId: "unifiedAssetId",
    symbol: "symbol",
    name: "name",
    icon: "icon",
    groupedTokens: [baseToken],
  }
  const items: {
    name: string
    balances: TokenBalancesRecord | undefined
    token: SwappableToken
    isBase: boolean
    expected: Record<BaseTokenInfo["defuseAssetId"], TokenValue>
  }[] = [
    {
      name: "returns empty object if balances is undefined",
      balances: undefined,
      token: { ...baseToken, defuseAssetId: "token1", decimals: 18 },
      isBase: true,
      expected: {},
    },
    {
      name: "maps base token correctly when address matches",
      balances: { token1: 1000n },
      token: { ...baseToken, defuseAssetId: "token1", decimals: 18 },
      isBase: true,
      expected: { token1: { amount: 1000n, decimals: 18 } },
    },
    {
      name: "skips base token when address does not match",
      balances: { token2: 500n },
      token: { ...baseToken, defuseAssetId: "token1", decimals: 18 },
      isBase: true,
      expected: {},
    },
    {
      name: "maps grouped token correctly when address matches",
      balances: { groupedToken1: 2000n },
      token: {
        ...unifiedToken,
        groupedTokens: [
          { ...baseToken, defuseAssetId: "groupedToken1", decimals: 8 },
        ],
      },
      isBase: false,
      expected: { groupedToken1: { amount: 2000n, decimals: 8 } },
    },
    {
      name: "skips grouped token if no match",
      balances: { groupedToken2: 3000n },
      token: {
        ...unifiedToken,
        groupedTokens: [
          { ...baseToken, defuseAssetId: "groupedToken1", decimals: 8 },
        ],
      },
      isBase: false,
      expected: {},
    },
  ]

  it.each(items)("$name", ({ balances, token, isBase, expected }) => {
    mockedIsBaseToken.mockReturnValue(isBase)

    const result = mapDepositBalancesToDecimals(balances, token)
    expect(result).toEqual(expected)
  })
})

describe("getBlockchainSelectItems()", () => {
  it("returns all chains of given unified token", () => {
    const result = getBlockchainSelectItems(
      {
        unifiedAssetId: "xrp",
        symbol: "XRP",
        name: "XRP",
        icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/52.png",
        groupedTokens: [
          {
            defuseAssetId: "nep141:xrp.omft.near",
            type: "native",
            address: "native",
            decimals: 6,
            icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/52.png",
            chainName: "xrpledger",
            bridge: "poa",
            symbol: "XRP",
            name: "XRP",
          },
          {
            defuseAssetId: "nep141:xrp.omft.near",
            address: "xrp.omft.near",
            decimals: 6,
            icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/52.png",
            chainName: "near",
            bridge: "direct",
            symbol: "XRP",
            name: "XRP",
          },
        ],
        tags: ["aid:xrp"],
      },
      {}
    )

    expect(Object.keys(result)).toEqual(["near", "xrpledger"])
  })

  it("returns a single chain for given regular token", () => {
    const result = getBlockchainSelectItems(
      {
        defuseAssetId: "nep141:xrp.omft.near",
        type: "native",
        address: "native",
        decimals: 6,
        icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/52.png",
        chainName: "xrpledger",
        bridge: "poa",
        symbol: "XRP",
        name: "XRP",
        tags: [], // no aid tag
      },
      {}
    )

    expect(Object.keys(result)).toEqual(["xrpledger"])
  })

  it("returns max possible withdraw (with aid)", () => {
    const result = getBlockchainSelectItems(
      {
        defuseAssetId: "nep141:xrp.omft.near",
        type: "native",
        decimals: 6,
        icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/52.png",
        chainName: "xrpledger",
        bridge: "poa",
        symbol: "XRP",
        name: "XRP",
        tags: ["aid:xrp"],
      },
      {
        "nep141:xrp.omft.near": { amount: 100n, decimals: 6 },
      }
    )

    expect(result).toHaveProperty(
      "near",
      expect.objectContaining({
        hotBalance: { amount: 100n, decimals: 6 },
      })
    )
  })

  it("returns max possible withdraw (without aid)", () => {
    const result = getBlockchainSelectItems(
      {
        defuseAssetId: "nep141:xrp.omft.near",
        type: "native",
        decimals: 6,
        icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/52.png",
        chainName: "xrpledger",
        bridge: "poa",
        symbol: "XRP",
        name: "XRP",
        tags: [], // no aid
      },
      {
        "nep141:xrp.omft.near": { amount: 100n, decimals: 6 },
      }
    )

    expect(result).toHaveProperty(
      "near",
      expect.objectContaining({
        hotBalance: { amount: 100n, decimals: 6 },
      })
    )
  })
})
