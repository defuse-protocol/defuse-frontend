import { parseUnits } from "viem"
import { describe, expect, it } from "vitest"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../types/base"
import { getRequiredSwapAmount } from "./withdrawService"

const usdcSolana: BaseTokenInfo = {
  defuseAssetId: "usdc-solana",
  address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  icon: "usdc.svg",
  chainName: "solana",
  bridge: "poa",
}

const usdcNear: BaseTokenInfo = {
  defuseAssetId: "usdc-near",
  address: "usdc.near",
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  icon: "usdc.svg",
  chainName: "near",
  bridge: "direct",
}

const unifiedUsdc: UnifiedTokenInfo = {
  unifiedAssetId: "usdc",
  symbol: "USDC",
  name: "USD Coin",
  icon: "usdc.svg",
  groupedTokens: [usdcSolana, usdcNear],
}

const turboSolana: BaseTokenInfo = {
  defuseAssetId: "turbo-solana",
  address: "turboXYZ123",
  symbol: "TURBO",
  name: "Turbo Token",
  decimals: 8,
  icon: "turbo.svg",
  chainName: "solana",
  bridge: "poa",
}

const turboEth: BaseTokenInfo = {
  defuseAssetId: "turbo-eth",
  address: "0xturbo456",
  symbol: "TURBO",
  name: "Turbo Token",
  decimals: 18,
  icon: "turbo.svg",
  chainName: "eth",
  bridge: "poa",
}

const unifiedTurbo: UnifiedTokenInfo = {
  unifiedAssetId: "turbo",
  symbol: "TURBO",
  name: "Turbo Token",
  icon: "turbo.svg",
  groupedTokens: [turboSolana, turboEth],
}

describe("getRequiredSwapAmount", () => {
  describe("with same decimals", () => {
    it("returns null when balances are missing", () => {
      const result = getRequiredSwapAmount(
        unifiedUsdc,
        usdcSolana,
        {
          amount: 100n,
          decimals: 6,
        },
        {}
      )
      expect(result).toBeNull()
    })

    it("handles direct withdrawal when tokenIn and tokenOut are the same", () => {
      const result = getRequiredSwapAmount(
        usdcSolana,
        usdcSolana,
        {
          amount: 100n,
          decimals: 6,
        },
        {
          "usdc-solana": 200n,
        }
      )

      expect(result).toEqual({
        swapParams: null,
        directWithdrawalAmount: {
          amount: 100n,
          decimals: 6,
        },
        tokenOut: usdcSolana,
      })
    })

    it("calculates swap amount for unified token with partial direct balance", () => {
      const result = getRequiredSwapAmount(
        unifiedUsdc,
        usdcSolana,
        {
          amount: 100n,
          decimals: 6,
        },
        {
          "usdc-solana": 30n,
          "usdc-near": 200n,
        }
      )

      expect(result).toEqual({
        swapParams: {
          tokensIn: [usdcNear],
          tokenOut: usdcSolana,
          amountIn: {
            amount: 70n,
            decimals: 6,
          },
          balances: {
            "usdc-solana": 30n,
            "usdc-near": 200n,
          },
        },
        directWithdrawalAmount: {
          amount: 30n,
          decimals: 6,
        },
        tokenOut: usdcSolana,
      })
    })

    it("handles case when direct balance covers full withdrawal", () => {
      const result = getRequiredSwapAmount(
        unifiedUsdc,
        usdcSolana,
        {
          amount: 50n,
          decimals: 6,
        },
        {
          "usdc-solana": 100n,
          "usdc-near": 200n,
        }
      )

      expect(result).toEqual({
        swapParams: null,
        directWithdrawalAmount: {
          amount: 50n,
          decimals: 6,
        },
        tokenOut: usdcSolana,
      })
    })

    it("requires full swap when no direct balance is available", () => {
      const result = getRequiredSwapAmount(
        unifiedUsdc,
        usdcSolana,
        {
          amount: 100n,
          decimals: 6,
        },
        {
          "usdc-solana": 0n,
          "usdc-near": 200n,
        }
      )

      expect(result).toEqual({
        swapParams: {
          tokensIn: [usdcNear],
          tokenOut: usdcSolana,
          amountIn: {
            amount: 100n,
            decimals: 6,
          },
          balances: {
            "usdc-solana": 0n,
            "usdc-near": 200n,
          },
        },
        directWithdrawalAmount: {
          amount: 0n,
          decimals: 6,
        },
        tokenOut: usdcSolana,
      })
    })
  })

  describe("with different decimals", () => {
    it("swaps if output token balance is 0", () => {
      const result = getRequiredSwapAmount(
        unifiedTurbo,
        turboSolana,
        {
          amount: parseUnits("0.000001", 24),
          decimals: 24,
        },
        {
          "turbo-eth": parseUnits("0.000001", turboEth.decimals),
          "turbo-solana": 0n,
        }
      )

      expect(result).toEqual({
        swapParams: {
          tokensIn: [turboEth],
          tokenOut: turboSolana,
          amountIn: {
            amount: parseUnits("0.000001", 24),
            decimals: 24,
          },
          balances: {
            "turbo-eth": parseUnits("0.000001", turboEth.decimals),
            "turbo-solana": 0n,
          },
        },
        directWithdrawalAmount: {
          amount: 0n,
          decimals: turboSolana.decimals,
        },
        tokenOut: turboSolana,
      })
    })

    it("does not swap dust", () => {
      const result = getRequiredSwapAmount(
        unifiedTurbo,
        turboSolana,
        {
          amount: parseUnits("0.100000003", 24),
          decimals: 24,
        },
        {
          "turbo-eth": parseUnits("0.1", turboEth.decimals),
          "turbo-solana": parseUnits("0.1", turboSolana.decimals),
        }
      )

      expect(result).toEqual({
        swapParams: null,
        directWithdrawalAmount: {
          amount: parseUnits("0.1", turboSolana.decimals),
          decimals: turboSolana.decimals,
        },
        tokenOut: turboSolana,
      })
    })

    it("swaps only if it is significant amount", () => {
      const result = getRequiredSwapAmount(
        unifiedTurbo,
        turboSolana,
        {
          amount: parseUnits("0.100000023", 24),
          decimals: 24,
        },
        {
          "turbo-eth": parseUnits("0.1", turboEth.decimals),
          "turbo-solana": parseUnits("0.1", turboSolana.decimals),
        }
      )

      expect(result).toEqual({
        swapParams: {
          tokensIn: [turboEth],
          tokenOut: turboSolana,
          amountIn: {
            amount: parseUnits("0.000000023", 24),
            decimals: 24,
          },
          balances: {
            "turbo-eth": parseUnits("0.1", turboEth.decimals),
            "turbo-solana": parseUnits("0.1", turboSolana.decimals),
          },
        },
        directWithdrawalAmount: {
          amount: parseUnits("0.1", turboSolana.decimals),
          decimals: turboSolana.decimals,
        },
        tokenOut: turboSolana,
      })
    })

    it("withdraws nothing if only dust is withdrawn", () => {
      const result = getRequiredSwapAmount(
        unifiedTurbo,
        turboSolana,
        {
          amount: parseUnits("0.000000003", 24),
          decimals: 24,
        },
        {
          "turbo-eth": parseUnits("1", turboEth.decimals),
          "turbo-solana": parseUnits("1", turboSolana.decimals),
        }
      )

      expect(result).toEqual({
        swapParams: null,
        directWithdrawalAmount: {
          amount: 0n,
          decimals: turboSolana.decimals,
        },
        tokenOut: turboSolana,
      })
    })
  })
})
