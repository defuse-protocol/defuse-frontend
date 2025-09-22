import { BlockchainEnum } from "@defuse-protocol/internal-utils"
import { describe, expect, it } from "vitest"
import { availableChainsForToken } from "./blockchain"

describe("availableChainsForToken()", () => {
  it("returns a single chain if given token is not part of a family", () => {
    const chains = availableChainsForToken({
      type: "native",
      name: "ETH",
      chainName: "eth",
      defuseAssetId: "eth",
      symbol: "ETH",
      decimals: 18,
      icon: "",
      bridge: "poa",
      tags: [], // no `aid:{string}` tag
    })

    expect(Object.keys(chains)).toEqual([BlockchainEnum.ETHEREUM])
  })

  it("returns all related chains if given token is a part of a family", () => {
    const chains = availableChainsForToken({
      type: "native",
      name: "XRP",
      chainName: "xrpledger",
      defuseAssetId: "xrp",
      symbol: "XRP",
      decimals: 6,
      icon: "",
      bridge: "poa",
      tags: ["aid:xrp"], // no `aid:{string}` tag
    })

    expect(Object.keys(chains)).toEqual([
      BlockchainEnum.NEAR,
      BlockchainEnum.XRPLEDGER,
    ])
  })
})
