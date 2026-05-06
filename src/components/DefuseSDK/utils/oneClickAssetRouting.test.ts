import { describe, expect, it } from "vitest"
import { getWithdrawDestinationAsset } from "./oneClickAssetRouting"

describe("getWithdrawDestinationAsset", () => {
  it("maps nBTC to the 1CS native BTC routing asset", () => {
    expect(getWithdrawDestinationAsset("nep141:nbtc.bridge.near")).toBe(
      "1cs_v1:btc:native:coin"
    )
  })

  it("returns the input asset id unchanged when no override is registered", () => {
    expect(getWithdrawDestinationAsset("nep141:usdc.near")).toBe(
      "nep141:usdc.near"
    )
  })

  it("returns the input asset id unchanged for nep245 multi-token assets", () => {
    const assetId = "nep245:v2_1.omni.hot.tg:56_11111111111111111111"
    expect(getWithdrawDestinationAsset(assetId)).toBe(assetId)
  })
})
