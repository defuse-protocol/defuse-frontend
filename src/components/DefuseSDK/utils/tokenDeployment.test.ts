import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@src/components/DefuseSDK/types/base"
import { describe, expect, it } from "vitest"
import { getChainFromDid, resolveTokenByDid } from "./tokenDeployment"

describe("getChainFromDid()", () => {
  it("extracts chain from identifier", () => {
    expect(getChainFromDid(["eth", "native"])).toEqual("eth")
  })
})

describe("resolveTokenByDid()", () => {
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

  it("returns first token that satisfies to deployment id", () => {
    expect(resolveTokenByDid(tokenList, ["aptos", "native"])).toHaveProperty(
      "defuseAssetId",
      "nep141:aptos.omft.near"
    )

    expect(
      resolveTokenByDid(tokenList, [
        "solana",
        "AXCp86262ZPfpcV9bmtmtnzmJSL5sD99mCVJD4GR9vS",
      ])
    ).toHaveProperty(
      "defuseAssetId",
      "nep141:sol-1f00bb36e75cfc8e1274c1507cc3054f5b3f3ce1.omft.near"
    )
  })
})
