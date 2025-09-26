import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { describe, expect, it } from "vitest"
import { extractTokenFamilyList, resolveTokenFamily } from "./tokenFamily"

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
        chainName: "near",
        symbol: "PUBLIC",
        name: "PublicAI",
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
        chainName: "solana",
        symbol: "PUBLIC",
        name: "PublicAI",
        deployments: [
          {
            chainName: "solana",
            bridge: "poa",
            decimals: 9,
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
    chainName: "aptos",
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
  {
    defuseAssetId: "nep141:token.publicailab.near",
    decimals: 18,
    icon: "https://s2.coinmarketcap.com/static/img/coins/128x128/37728.png",
    chainName: "bsc",
    symbol: "PUBLIC",
    name: "PublicAI",
    tags: ["aid:public"],
    deployments: [
      {
        chainName: "bsc",
        bridge: "near_omni",
        decimals: 18,
        address: "0x1f00bb36e75cfc8e1274c1507cc3054f5b3f3ce1",
      },
    ],
  },
]

describe("extractTokenFamilyList()", () => {
  it("builds a family list from given tokens array", () => {
    const familyList = extractTokenFamilyList(tokenList)

    expect(familyList).toEqual([
      {
        aid: "public",
        tokenIds: [
          "nep141:token.publicailab.near",
          "nep141:sol-1f00bb36e75cfc8e1274c1507cc3054f5b3f3ce1.omft.near",
          "nep141:token.publicailab.near",
        ],
      },
    ])
  })
})

describe("resolveTokenFamily()", () => {
  const familyList = extractTokenFamilyList(tokenList)

  it("resolves a token family from a token", () => {
    const token = tokenList[0]
    const family = resolveTokenFamily(familyList, token)
    expect(family).toEqual({
      aid: "public",
      tokenIds: [
        "nep141:token.publicailab.near",
        "nep141:sol-1f00bb36e75cfc8e1274c1507cc3054f5b3f3ce1.omft.near",
        "nep141:token.publicailab.near",
      ],
    })
  })

  it("returns null if a token doesn't belongs to a family", () => {
    const token = tokenList[1]
    const family = resolveTokenFamily(familyList, token)
    expect(family).toEqual(null)
  })
})
