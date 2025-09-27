import { BlockchainEnum } from "@defuse-protocol/internal-utils"
import { describe, expect, it } from "vitest"
import { availableChainsForToken } from "./blockchain"

describe("availableChainsForToken()", () => {
  it("returns a single chain if given token is not part of a family", () => {
    const chains = availableChainsForToken({
      name: "ETH",
      originChainName: "eth",
      defuseAssetId: "eth",
      symbol: "ETH",
      decimals: 18,
      icon: "",
      tags: [], // no `aid:{string}` tag
      deployments: [
        {
          chainName: "eth",
          bridge: "poa",
          decimals: 18,
          type: "native",
        },
      ],
    })

    expect(Object.keys(chains)).toEqual([BlockchainEnum.ETHEREUM])
  })

  it("returns all related chains if given token is a part of a family", () => {
    const chains = availableChainsForToken({
      name: "XRP",
      originChainName: "xrpledger",
      defuseAssetId: "xrp",
      symbol: "XRP",
      decimals: 6,
      icon: "",
      tags: ["aid:xrp"], // no `aid:{string}` tag
      deployments: [
        {
          chainName: "xrpledger",
          bridge: "poa",
          decimals: 6,
          type: "native",
        },
      ],
    })

    expect(Object.keys(chains)).toEqual([
      BlockchainEnum.NEAR,
      BlockchainEnum.XRPLEDGER,
    ])
  })
})
