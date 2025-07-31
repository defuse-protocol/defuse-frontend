import { describe, expect, it } from "vitest"
import type { BaseTokenInfo } from "../../../../types/base"
import { getFastWithdrawals } from "./utils"

describe("getFastWithdrawals", () => {
  const tokenETH: BaseTokenInfo = {
    defuseAssetId: "ETH",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    address: "0x0",
    chainName: "eth",
    icon: "",
    bridge: "direct",
  }

  it("returns empty object when shouldShowHotBalance is false", () => {
    const poaBridge = {
      ETH: { amount: 100n, decimals: 18 },
    }

    const liquidity = {
      "ETH#ETH": 100n,
    }

    const result = getFastWithdrawals(
      tokenETH,
      { ETH: 100n },
      poaBridge,
      liquidity
    )

    expect(result).toEqual({})
  })

  it("returns proper value when shouldShowHotBalance is true", () => {
    const poaBridge = {
      ETH: { amount: 100n, decimals: 18 },
    }

    const liquidity = {
      "ETH#ETH": 100n,
    }

    const result = getFastWithdrawals(
      tokenETH,
      { ETH: 150n },
      poaBridge,
      liquidity
    )

    expect(result).toEqual({
      ETH: { amount: 100n, decimals: 18 },
    })
  })

  it("handles token pairs with no liquidity gracefully", () => {
    const poaBridge = {
      ETH: { amount: 150n, decimals: 18 },
      USDC: { amount: 50n, decimals: 6 },
    }

    const liquidity = {
      "ETH#USDC": 30n,
      "USDC#ETH": 20n,
    }

    const result = getFastWithdrawals(
      tokenETH,
      { ETH: 200n, USDC: 100n },
      poaBridge,
      liquidity
    )

    expect(result).toHaveProperty("ETH")
    expect(result).not.toHaveProperty("USDC")
  })

  it("returns empty object if all balances are 0", () => {
    const result = getFastWithdrawals(tokenETH, { ETH: 0n }, {}, {})
    expect(result).toEqual({})
  })
})
