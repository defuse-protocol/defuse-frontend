import type { BaseTokenInfo } from "@src/components/DefuseSDK/types/base"
import { getTokenAid } from "@src/components/DefuseSDK/utils/token"
import { extractTokenFamilyList } from "@src/components/DefuseSDK/utils/tokenFamily"
import { describe, expect, it } from "vitest"
import { resolveTokenOut } from "./withdrawFormReducer"

describe("resolveTokenOut()", () => {
  const tokenList: BaseTokenInfo[] = [
    {
      originChainName: "solana",
      decimals: 0,
      defuseAssetId: "",
      icon: "",
      name: "",
      symbol: "",
      tags: ["aid:eth"],
      deployments: [
        { decimals: 0, address: "", bridge: "poa", chainName: "solana" },
      ],
    },
    {
      originChainName: "arbitrum",
      decimals: 0,
      defuseAssetId: "",
      icon: "",
      name: "",
      symbol: "",
      tags: ["aid:eth"],
      deployments: [
        { decimals: 0, address: "", bridge: "poa", chainName: "arbitrum" },
      ],
    },
    {
      originChainName: "eth",
      decimals: 0,
      defuseAssetId: "",
      icon: "",
      name: "",
      symbol: "",
      tags: ["aid:eth"],
      deployments: [
        { decimals: 0, address: "", bridge: "poa", chainName: "eth" },
      ],
    },
    {
      originChainName: "hyperliquid",
      decimals: 0,
      defuseAssetId: "",
      icon: "",
      name: "",
      symbol: "",
      tags: ["aid:eth"],
      deployments: [
        { decimals: 0, address: "", bridge: "poa", chainName: "hyperliquid" },
      ],
    },
  ]

  const tokenFamilies = extractTokenFamilyList(tokenList)

  it("returns a token from the same family", () => {
    const t = tokenList[0]
    const [token, _depl] = resolveTokenOut(
      "arbitrum",
      t,
      tokenFamilies,
      tokenList
    )
    expect(getTokenAid(token)).toEqual("eth")
  })

  it("returns a token with given chain", () => {
    const t = tokenList[0]
    const [token, depl] = resolveTokenOut(
      "arbitrum",
      t,
      tokenFamilies,
      tokenList
    )
    expect(token).toHaveProperty("originChainName", "arbitrum")
    expect(depl).toHaveProperty("chainName", "arbitrum")
  })

  it("returns given token if chain is near_intents", () => {
    const t = tokenList[0]
    const [token, _depl] = resolveTokenOut(
      "near_intents",
      t,
      tokenFamilies,
      tokenList
    )
    expect(token).toBe(t)
  })

  it("returns corresponded chain for hyperliquid token", () => {
    const t = tokenList[3]
    const [token, depl] = resolveTokenOut(
      "hyperliquid",
      t,
      tokenFamilies,
      tokenList
    )
    expect(token).toHaveProperty("originChainName", "eth")
    expect(depl).toHaveProperty("chainName", "eth")
  })
})
