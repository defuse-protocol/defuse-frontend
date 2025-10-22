import { AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import { TypedError } from "near-api-js/lib/providers"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { validationRecipientAddress } from "./validationRecipientAddress"

vi.mock("@src/components/DefuseSDK/constants/nearClient", () => ({
  nearClient: {
    query: vi.fn(async (args: unknown) => {
      const params = args as { account_id?: string }
      if (params?.account_id === "no-exists.near") {
        throw new TypedError("Account does not exist", "AccountDoesNotExist")
      }
      return {}
    }),
  },
}))

describe("validationRecipientAddress", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Near Intents network", () => {
    it("should accept valid NEAR address", async () => {
      const result = await validationRecipientAddress(
        "test.near",
        "near_intents",
        "valid-recipient.near",
        AuthMethod.Near
      )
      expect(result.isOk()).toBe(true)
    })
    it("should reject invalid NEAR address", async () => {
      const result = await validationRecipientAddress(
        "invalid_near-",
        "near_intents",
        "valid-recipient.near",
        AuthMethod.Near
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
    it("should reject self NEAR address", async () => {
      const result = await validationRecipientAddress(
        "valid-recipient.near",
        "near_intents",
        "valid-recipient.near",
        AuthMethod.Near
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("SELF_WITHDRAWAL")
    })

    it("should accept valid WebAuthn address", async () => {
      const webAuthnPublicKey =
        "p256:3NSY8SFTWoPFMrTGdLVqPogirCyt3kMnUajXoDQuVeCsA6wzkMMp5whBqymAPM7xFiBthDKueiUv1zVAj7GDT8rQ"
      const result = await validationRecipientAddress(
        "test.near",
        "near_intents",
        authIdentity.authHandleToIntentsUserId(
          webAuthnPublicKey,
          AuthMethod.WebAuthn
        ),
        AuthMethod.Near
      )
      expect(result.isOk()).toBe(true)
    })
    it("should reject self WebAuthn address", async () => {
      const webAuthnPublicKey =
        "p256:3NSY8SFTWoPFMrTGdLVqPogirCyt3kMnUajXoDQuVeCsA6wzkMMp5whBqymAPM7xFiBthDKueiUv1zVAj7GDT8rQ"
      const userAddress = authIdentity.authHandleToIntentsUserId(
        webAuthnPublicKey,
        AuthMethod.WebAuthn
      )
      const result = await validationRecipientAddress(
        userAddress,
        "near_intents",
        userAddress,
        AuthMethod.Near
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("SELF_WITHDRAWAL")
    })

    it("should accept valid EVM address", async () => {
      const result = await validationRecipientAddress(
        "0x5ff8d1644ec46f23f1e3981831ed2ec3dd40c2ca",
        "near_intents",
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        AuthMethod.Near
      )
      expect(result.isOk()).toBe(true)
    })
    it("should reject self EVM address", async () => {
      const userAddress = "0x5ff8d1644ec46f23f1e3981831ed2ec3dd40c2ca"
      const result = await validationRecipientAddress(
        userAddress,
        "near_intents",
        userAddress,
        AuthMethod.Near
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("SELF_WITHDRAWAL")
    })

    it("should accept valid Solana address", async () => {
      const userAddress = "DRpbCBMxVnDK7maPGv7vhuYme3jNdBAt4YHw2wKgqWPU"
      const result = await validationRecipientAddress(
        "test.near",
        "near_intents",
        authIdentity.authHandleToIntentsUserId(userAddress, AuthMethod.Solana),
        AuthMethod.Near
      )
      expect(result.isOk()).toBe(true)
    })
    it("should reject self Solana address", async () => {
      const userAddress = authIdentity.authHandleToIntentsUserId(
        "DRpbCBMxVnDK7maPGv7vhuYme3jNdBAt4YHw2wKgqWPU",
        AuthMethod.Solana
      )
      const result = await validationRecipientAddress(
        userAddress,
        "near_intents",
        userAddress,
        AuthMethod.Near
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("SELF_WITHDRAWAL")
    })

    it("should accept valid Ton address", async () => {
      const userAddress =
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
      const result = await validationRecipientAddress(
        "999caef8c54fb1664287eb5ef8ba105424609135f2f414702c30b7866f77a912",
        "near_intents",
        authIdentity.authHandleToIntentsUserId(userAddress, AuthMethod.Ton),
        AuthMethod.Near
      )
      expect(result.isOk()).toBe(true)
    })
    it("should reject invalid Ton address", async () => {
      const result = await validationRecipientAddress("invalid_ton", "ton")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
    it("should reject self Ton address", async () => {
      const userAddress = authIdentity.authHandleToIntentsUserId(
        "a492efa88ae97e44f36292b9fed549ef3affffb1187c3db8f8ccfede1750d605",
        AuthMethod.Ton
      )
      const result = await validationRecipientAddress(
        userAddress,
        "near_intents",
        userAddress,
        AuthMethod.Near
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("SELF_WITHDRAWAL")
    })
  })

  describe("NEAR network", async () => {
    it("should accept valid NEAR address", async () => {
      const result = await validationRecipientAddress("test.near", "near")
      expect(result.isOk()).toBe(true)
    })

    it("should accept EVM address for NEAR network", async () => {
      const result = await validationRecipientAddress(
        authIdentity.authHandleToIntentsUserId(
          "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
          AuthMethod.Near
        ),
        "near"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject non-existent explicit NEAR address", async () => {
      const result = await validationRecipientAddress("no-exists.near", "near")

      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("NEAR_ACCOUNT_DOES_NOT_EXIST")
    })
  })

  describe("EVM networks", () => {
    it("should accept valid EVM address for eth", async () => {
      const result = await validationRecipientAddress(
        "0xAb5801a7D398351b8bE11C439e05C5B3259aec9B",
        "eth"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid EVM address", async () => {
      const result = await validationRecipientAddress("0xd", "eth")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Bitcoin network", () => {
    it("should accept valid Bitcoin address", async () => {
      const result = await validationRecipientAddress(
        "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
        "bitcoin"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid Bitcoin address", async () => {
      const result = await validationRecipientAddress(
        "invalid_bitcoin",
        "bitcoin"
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Solana network", () => {
    it("should accept valid Solana address", async () => {
      const result = await validationRecipientAddress(
        "DRpbCBMxVnDK7maPGv7vhuYme3jNdBAt4YHw2wKgqWPU",
        "solana"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid Solana address", async () => {
      const result = await validationRecipientAddress(
        "invalid_solana",
        "solana"
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Dogecoin network", () => {
    it("should accept valid Dogecoin address", async () => {
      const result = await validationRecipientAddress(
        "DPvG6Dk8cQRX7VauYbYHTxStD3kHZGBSda",
        "dogecoin"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid Dogecoin address", async () => {
      const result = await validationRecipientAddress(
        "invalid_dogecoin",
        "dogecoin"
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Xrpledger network", () => {
    it("should accept valid Xrpledger address", async () => {
      const result = await validationRecipientAddress(
        "rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn",
        "xrpledger"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid Xrpledger address", async () => {
      const result = await validationRecipientAddress(
        "invalid_xrpledger",
        "xrpledger"
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Zcash network", () => {
    it("should accept valid Zcash address", async () => {
      const result = await validationRecipientAddress(
        "t1XJD5btQc9qHHzywPS8xhPbs2hbXGXWLFq",
        "zcash"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid Zcash address", async () => {
      const result = await validationRecipientAddress("invalid_zcash", "zcash")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Tron network", () => {
    it("should accept valid Tron address", async () => {
      const result = await validationRecipientAddress(
        "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        "tron"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid Tron address", async () => {
      const result = await validationRecipientAddress("invalid_tron", "tron")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Ton network", () => {
    it("should accept valid Ton address", async () => {
      const result = await validationRecipientAddress(
        "EQCz7_vtRwQWnKPYVb-JBl8WqF6MdwypKBT1KCeZzvS7DQdD",
        "ton"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid Ton address", async () => {
      const result = await validationRecipientAddress("invalid_ton", "ton")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Sui network", () => {
    it("should accept valid Sui address", async () => {
      const result = await validationRecipientAddress(
        "0x2f1c9a8d3b4e5f6a7b8c9d0e1f2a3b4c5d6e7f8090a1b2c3d4e5f6a7b8c9d0e1",
        "sui"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid Sui address", async () => {
      const result = await validationRecipientAddress("invalid_sui", "sui")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Stellar network", () => {
    it("should accept valid Stellar address", async () => {
      const result = await validationRecipientAddress(
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        "stellar"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid Stellar address", async () => {
      const result = await validationRecipientAddress(
        "invalid_stellar",
        "stellar"
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Aptos network", () => {
    it("should accept valid Aptos address", async () => {
      const result = await validationRecipientAddress(
        "0x2f1c9a8d3b4e5f6a7b8c9d0e1f2a3b4c5d6e7f8090a1b2c3d4e5f6a7b8c9d0e1",
        "aptos"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid Aptos address", async () => {
      const result = await validationRecipientAddress("invalid_aptos", "aptos")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Cardano network", () => {
    it("should accept valid Cardano address", async () => {
      const result = await validationRecipientAddress(
        "addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgse35a3x",
        "cardano"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid Cardano address", async () => {
      const result = await validationRecipientAddress(
        "invalid_cardano",
        "cardano"
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Edge cases", () => {
    it("should handle empty address", async () => {
      const result = await validationRecipientAddress("", "near")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })

    it("should handle whitespace-only address", async () => {
      const result = await validationRecipientAddress(" ", "near")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })
})
