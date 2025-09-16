import type { BaseTokenInfo } from "@src/components/DefuseSDK/types/base"
import { getTokenAid } from "@src/components/DefuseSDK/utils/token"
import { extractTokenFamilyList } from "@src/components/DefuseSDK/utils/tokenFamily"
import { describe, expect, it } from "vitest"
import { resolveTokenOut } from "./withdrawFormReducer"

describe("resolveTokenOut()", () => {
  const tokenList: BaseTokenInfo[] = [
    {
      bridge: "poa",
      chainName: "solana",
      decimals: 0,
      defuseAssetId: "",
      icon: "",
      name: "",
      symbol: "",
      address: "",
      tags: ["aid:foo"],
    },
    {
      bridge: "poa",
      chainName: "arbitrum",
      decimals: 0,
      defuseAssetId: "",
      icon: "",
      name: "",
      symbol: "",
      address: "",
      tags: ["aid:foo"],
    },
    {
      bridge: "poa",
      chainName: "eth",
      decimals: 0,
      defuseAssetId: "",
      icon: "",
      name: "",
      symbol: "",
      address: "",
      tags: ["aid:foo"],
    },
    {
      bridge: "poa",
      chainName: "hyperliquid",
      decimals: 0,
      defuseAssetId: "",
      icon: "",
      name: "",
      symbol: "ETH", // important to pass symbol
      address: "",
      tags: ["aid:foo"],
    },
  ]

  const tokenFamilies = extractTokenFamilyList(tokenList)

  it("returns a token from the same family", () => {
    const t = tokenList[0]
    const result = resolveTokenOut("arbitrum", t, tokenFamilies, tokenList)
    expect(getTokenAid(result)).toEqual("foo")
  })

  it("returns a token with given chain", () => {
    const t = tokenList[0]
    const result = resolveTokenOut("arbitrum", t, tokenFamilies, tokenList)
    expect(result).toHaveProperty("chainName", "arbitrum")
  })

  it("returns given token if chain is near_intents", () => {
    const t = tokenList[0]
    const result = resolveTokenOut("near_intents", t, tokenFamilies, tokenList)
    expect(result).toBe(t)
  })

  it("returns corresponded chain for hyperliquid token", () => {
    const t = tokenList[3]
    const result = resolveTokenOut("hyperliquid", t, tokenFamilies, tokenList)
    expect(result).toHaveProperty("chainName", "eth")
  })
})
