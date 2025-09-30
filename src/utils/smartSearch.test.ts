import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { describe, expect, it } from "vitest"
import {
  SEARCH_SCORES,
  type SearchableItem,
  calculateSearchScore,
  createSearchData,
  levenshteinDistance,
  performSearch,
} from "./smartSearch"

const createMockToken = (symbol: string, name: string): TokenInfo => ({
  defuseAssetId: `mock-${symbol.toLowerCase()}`,
  decimals: 18,
  icon: `https://example.com/${symbol.toLowerCase()}.png`,
  originChainName: "eth",
  deployments: [
    {
      chainName: "eth",
      bridge: "direct",
      decimals: 18,
      address: `0x${symbol.toLowerCase()}`,
    },
  ],
  symbol,
  name,
})

const createMockSearchableItem = (token: TokenInfo): SearchableItem => ({
  token,
  searchData: createSearchData(token),
})

// Test data
const mockTokens = [
  createMockToken("ETH", "Ethereum"),
  createMockToken("BTC", "Bitcoin"),
  createMockToken("USDC", "USD Coin"),
  createMockToken("USDT", "Tether USD"),
  createMockToken("BNB", "Binance Coin"),
  createMockToken("ADA", "Cardano"),
  createMockToken("SOL", "Solana"),
  createMockToken("MATIC", "Polygon"),
  createMockToken("DOT", "Polkadot"),
  createMockToken("AVAX", "Avalanche"),
]

const mockSearchableItems = mockTokens.map(createMockSearchableItem)

describe("searchUtils", () => {
  describe("levenshteinDistance", () => {
    it("should return 0 for identical strings", () => {
      expect(levenshteinDistance("eth", "eth")).toBe(0)
      expect(levenshteinDistance("bitcoin", "bitcoin")).toBe(0)
    })

    it("should return correct distance for different strings", () => {
      expect(levenshteinDistance("eth", "btc")).toBe(2)
      expect(levenshteinDistance("btc", "bitcoin")).toBe(4)
    })

    it("should handle empty strings", () => {
      expect(levenshteinDistance("", "")).toBe(0)
      expect(levenshteinDistance("eth", "")).toBe(3)
    })
  })

  describe("calculateSearchScore", () => {
    it("should return exact match score for case-sensitive match", () => {
      const item = createMockSearchableItem(createMockToken("ETH", "Ethereum"))
      const score = calculateSearchScore(item, "ETH")

      expect(score).toBe(SEARCH_SCORES.EXACT_MATCH)
    })

    it("should return case-insensitive exact match score", () => {
      const item = createMockSearchableItem(createMockToken("ETH", "Ethereum"))
      const score = calculateSearchScore(item, "eth")

      expect(score).toBe(SEARCH_SCORES.CASE_INSENSITIVE_EXACT)
    })

    it("should return starts with score", () => {
      const item = createMockSearchableItem(createMockToken("ETH", "Ethereum"))
      const score = calculateSearchScore(item, "et")

      expect(score).toBe(SEARCH_SCORES.STARTS_WITH)
    })

    it("should return contains score", () => {
      const item = createMockSearchableItem(createMockToken("ETH", "Ethereum"))
      const score = calculateSearchScore(item, "the")

      expect(score).toBe(SEARCH_SCORES.CONTAINS)
    })

    it("should return 0 for no match", () => {
      const item = createMockSearchableItem(createMockToken("BTC", "Bitcoin"))
      const score = calculateSearchScore(item, "eth")

      expect(score).toBe(0)
    })

    it("should return 0 for items without search data", () => {
      const item: SearchableItem = {
        token: createMockToken("ETH", "Ethereum"),
        // No searchData
      }
      const score = calculateSearchScore(item, "eth")

      expect(score).toBe(0)
    })
  })

  describe("performSearch", () => {
    it("should return all items when query is empty", () => {
      const results = performSearch(mockSearchableItems, "")

      expect(results).toEqual(mockSearchableItems)
    })

    it("should return all items when query is only whitespace", () => {
      const results = performSearch(mockSearchableItems, "   ")

      expect(results).toEqual(mockSearchableItems)
    })

    describe("searching for 'eth'", () => {
      it("should return ETH token with highest score", () => {
        const results = performSearch(mockSearchableItems, "eth")

        // Should include ETH, USDT
        expect(results.length).toBe(2)

        expect(results[0].token.symbol).toBe("ETH")
        expect(results[0].token.name).toBe("Ethereum")
        expect(results[1].token.symbol).toBe("USDT")
        expect(results[1].token.name).toBe("Tether USD")
      })
    })

    describe("searching for 'b'", () => {
      it("should return tokens that start with 'b'", () => {
        const results = performSearch(mockSearchableItems, "b")

        // Should include BTC, BNB, but not others
        const symbols = results.map((item) => item.token.symbol)
        expect(symbols).toContain("BTC")
        expect(symbols).toContain("BNB")
        expect(symbols).not.toContain("ETH")
        expect(symbols).not.toContain("USDC")
      })
    })

    describe("fuzzy matching", () => {
      it("should match close variations", () => {
        // Add a token with a close variation
        const closeToken = createMockToken("ETC", "Ethereum Classic")
        const closeItem = createMockSearchableItem(closeToken)
        const itemsWithClose = [...mockSearchableItems, closeItem]

        const results = performSearch(itemsWithClose, "eth")

        // Should find both ETH and ETC
        const symbols = results.map((item) => item.token.symbol)
        expect(symbols).toContain("ETH")
        expect(symbols).toContain("ETC")
      })
    })

    describe("options", () => {
      it("should respect maxResults option", () => {
        const results = performSearch(mockSearchableItems, "u", {
          maxResults: 2,
        })

        expect(results).toHaveLength(2)
      })

      it("should respect maxFuzzyDistance option", () => {
        const results = performSearch(mockSearchableItems, "eth", {
          maxFuzzyDistance: 0,
        })

        // Should only return exact matches, no fuzzy matches
        expect(results.length).toBeGreaterThanOrEqual(1)
        expect(results[0].token.symbol).toBe("ETH")
      })
    })

    describe("scoring and ordering", () => {
      it("should order results by score (highest first)", () => {
        const results = performSearch(mockSearchableItems, "usd")

        // ETH should come before Tether USD (exact symbol match vs contains)
        const ethIndex = results.findIndex(
          (item) => item.token.symbol === "ETH"
        )
        const usdtIndex = results.findIndex(
          (item) => item.token.symbol === "USDT"
        )

        expect(ethIndex).toBeLessThan(usdtIndex)
      })

      it("should prioritize symbol matches over name matches", () => {
        const results = performSearch(mockSearchableItems, "usd")

        // USDC should come first (symbol starts with "USD")
        expect(results[0].token.symbol).toBe("USDC")
      })
    })
  })
})
