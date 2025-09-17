import { describe, expect, it } from "vitest"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../types/base"
import { flattenTokenList, getTokenAid } from "./token"

describe("flattenTokenList()", () => {
  const tokenList: (BaseTokenInfo | UnifiedTokenInfo)[] = [
    {
      unifiedAssetId: "public",
      symbol: "PUBLIC",
      name: "PublicAI",
      icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/37728.png",
      groupedTokens: [
        {
          defuseAssetId: "nep141:token.publicailab.near",
          address: "token.publicailab.near",
          decimals: 18,
          icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/37728.png",
          chainName: "near",
          bridge: "direct",
          symbol: "PUBLIC",
          name: "PublicAI",
          tags: ["aid:public"],
        },
        {
          defuseAssetId:
            "nep141:sol-1f00bb36e75cfc8e1274c1507cc3054f5b3f3ce1.omft.near",
          address: "AXCp86262ZPfpcV9bmtmtnzmJSL5sD99mCVJD4GR9vS",
          decimals: 9,
          icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/37728.png",
          chainName: "solana",
          bridge: "poa",
          symbol: "PUBLIC",
          name: "PublicAI",
          tags: ["foo"],
        },
      ],
      tags: ["aid:public"],
    },
    {
      defuseAssetId: "nep141:aptos.omft.near",
      type: "native",
      decimals: 8,
      icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/21794.png",
      chainName: "aptos",
      bridge: "poa",
      symbol: "APT",
      name: "Aptos",
      tags: ["mc:34"],
    },
  ]

  it("flattens unified tokens", () => {
    const result = flattenTokenList(tokenList)

    expect(result).toEqual([
      expect.objectContaining({
        defuseAssetId: "nep141:token.publicailab.near",
      }),
      expect.objectContaining({
        defuseAssetId:
          "nep141:sol-1f00bb36e75cfc8e1274c1507cc3054f5b3f3ce1.omft.near",
      }),
      expect.objectContaining({
        defuseAssetId: "nep141:aptos.omft.near",
      }),
    ])
  })

  it("preserves tags and deduplicates them", () => {
    const result = flattenTokenList(tokenList)

    expect(result).toEqual([
      expect.objectContaining({
        defuseAssetId: "nep141:token.publicailab.near",
        tags: ["aid:public"],
      }),
      expect.objectContaining({
        defuseAssetId:
          "nep141:sol-1f00bb36e75cfc8e1274c1507cc3054f5b3f3ce1.omft.near",
        tags: ["aid:public", "foo"],
      }),
      expect.objectContaining({
        defuseAssetId: "nep141:aptos.omft.near",
        tags: ["mc:34"],
      }),
    ])
  })
})

describe("getTokenAid()", () => {
  it("extracts aid from tags", () => {
    expect(
      getTokenAid({
        tags: ["mc:1", "aid:public"],
      })
    ).toEqual("public")
  })

  it("returns null if no aid tag found", () => {
    expect(
      getTokenAid({
        tags: ["mc:1"],
      })
    ).toEqual(null)
  })
})
