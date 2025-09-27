import { describe, expect, it } from "vitest"
import type { TokenInfo } from "../types/base"
import { flattenTokenList, getTokenAid } from "./token"

describe("flattenTokenList()", () => {
  const tokenList: TokenInfo[] = [
    {
      unifiedAssetId: "public",
      symbol: "PUBLIC",
      name: "PublicAI",
      icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/37728.png",
      groupedTokens: [
        {
          defuseAssetId: "nep141:token.publicailab.near",
          decimals: 18,
          icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/37728.png",
          originChainName: "near",
          symbol: "PUBLIC",
          name: "PublicAI",
          tags: ["aid:public"],
          deployments: [
            {
              chainName: "near",
              bridge: "direct",
              decimals: 18,
              address: "token.publicailab.near",
            },
          ],
        },
        {
          defuseAssetId:
            "nep141:sol-1f00bb36e75cfc8e1274c1507cc3054f5b3f3ce1.omft.near",
          decimals: 9,
          icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/37728.png",
          originChainName: "solana",
          symbol: "PUBLIC",
          name: "PublicAI",
          tags: ["foo"],
          deployments: [
            {
              chainName: "solana",
              bridge: "poa",
              decimals: 18,
              address: "AXCp86262ZPfpcV9bmtmtnzmJSL5sD99mCVJD4GR9vS",
            },
          ],
        },
      ],
      tags: ["aid:public"],
    },
    {
      defuseAssetId: "nep141:aptos.omft.near",
      decimals: 8,
      icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/21794.png",
      originChainName: "aptos",
      symbol: "APT",
      name: "Aptos",
      tags: ["mc:34"],
      deployments: [
        {
          chainName: "aptos",
          bridge: "poa",
          decimals: 8,
          type: "native",
        },
      ],
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
