import { deserialize } from "@src/components/DefuseSDK/utils/deserialize"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { serialize } from "../../../utils/serialize"
import type { GiftMakerHistory } from "./giftMakerHistory"
import { config, indexedDBStorage } from "./indexedDBStorage"
import { storage } from "./storageOperations"

describe("storage", () => {
  const mockStorageData = {
    state: {
      gifts: {
        alice: [
          {
            intentHashes: ["Amy7ek15DBZZhQB7DHynCUxKGTYZJCmawNK841RvS69Q"],
            tokenDiff: {
              "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near":
                100n,
            },
            secretKey: "ed25519:mWCSdwW",
            message: "",
            createdAt: 1743010969229,
            updatedAt: 1743010969229,
          },
        ],
      },
    },
    version: 2,
  }

  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("should get data from localStorage or sessionStorage if indexedDBStorage is empty", async () => {
    vi.spyOn(indexedDBStorage, "getItem").mockResolvedValue(null)
    vi.spyOn(localStorage, "getItem").mockReturnValue(
      serialize(mockStorageData)
    )
    vi.spyOn(sessionStorage, "getItem").mockResolvedValue(
      serialize(mockStorageData)
    )

    const result = await storage.getItem(config.storeName)
    expect(result).toEqual(deserialize(serialize(mockStorageData)))
  })

  it("should return err if an error occurs in all storage operations", async () => {
    vi.spyOn(indexedDBStorage, "setItem").mockImplementation(() => {
      throw new Error("test")
    })

    const result = await storage.setItem(config.storeName, mockStorageData)
    expect(result).toEqual({
      tag: "err",
      reason: "ERR_SET_ITEM_FAILED_TO_STORAGE",
    })
  })

  it("should return ok if all storage operations are successful", async () => {
    vi.spyOn(indexedDBStorage, "setItem").mockResolvedValue("test-key")

    const result = await storage.setItem(config.storeName, mockStorageData)
    expect(result).toEqual({
      tag: "ok",
    })
  })
})

describe("processGiftData", () => {
  const mockGift: GiftMakerHistory = {
    intentHashes: ["intentHash"],
    message: "message",
    secretKey: "ed25519:secretKey",
    iv: "e9QTDukeRo97zGVZ",
    tokenDiff: {
      "nep141:usdc": 1000n,
    },
    createdAt: 1743010969229,
    updatedAt: 1742910077547,
  }
  const mockUserId = "testUser"

  const mockStorageData = {
    state: {
      gifts: {
        [mockUserId]: [mockGift],
      },
    },
  }

  it("should serialize correct storage data", () => {
    const result = JSON.parse(serialize(mockStorageData))
    expect(result).toMatchInlineSnapshot(`
      {
        "state": {
          "gifts": {
            "testUser": [
              {
                "createdAt": 1743010969229,
                "intentHashes": [
                  "intentHash",
                ],
                "iv": "e9QTDukeRo97zGVZ",
                "message": "message",
                "secretKey": "ed25519:secretKey",
                "tokenDiff": {
                  "nep141:usdc": {
                    "__type": "bigint",
                    "value": "1000",
                  },
                },
                "updatedAt": 1742910077547,
              },
            ],
          },
        },
      }
    `)
  })

  it("should deserialize correct storage data", () => {
    const result = deserialize(serialize(mockStorageData))
    expect(result).toEqual(mockStorageData)
  })
})
