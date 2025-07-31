import * as v from "valibot"
import { describe, expect, it } from "vitest"
import { GiftStorageSchemaV0, GiftStorageSchemaV2 } from "./schemaStorage"

describe("GiftStorageSchema", () => {
  it("valid gift storage data v1", () => {
    const giftStorageData = {
      state: {
        gifts: {
          user1: [
            {
              giftId: "1",
              intentHashes: ["hash1", "hash2"],
              tokenDiff: {
                "nep141:usdc": "1000",
              },
              token: {
                defuseAssetId: "nep141:usdc",
                address: "usdc",
                symbol: "USDC",
                name: "USD Coin",
                decimals: 6,
                icon: "https://example.com/usdc.png",
                chainName: "near",
              },
              secretKey: "ed25519:secretKey",
              accountId: "accountId",
              message: "message",
              updatedAt: 1742910077547,
            },
          ],
        },
      },
    }
    const result = v.parse(GiftStorageSchemaV0, giftStorageData)
    expect(result).toEqual(giftStorageData)
  })

  it("valid gift storage data v2", () => {
    const giftStorageData = {
      state: {
        gifts: {
          user1: [
            {
              intentHashes: ["hash1"],
              tokenDiff: {
                "nep141:usdc": "1000",
              },
              secretKey: "ed25519:secretKey",
              message: "message",
              createdAt: 1742910077547,
              updatedAt: 1742910077547,
            },
          ],
        },
      },
    }
    const result = v.parse(GiftStorageSchemaV2, giftStorageData)
    expect(result).toEqual(giftStorageData)
  })
})
