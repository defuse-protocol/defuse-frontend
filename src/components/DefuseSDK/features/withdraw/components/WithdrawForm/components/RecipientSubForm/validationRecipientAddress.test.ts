import { AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import { describe, expect, it } from "vitest"
import { validationRecipientAddress } from "./validationRecipientAddress"

describe("validationRecipientAddress", () => {
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
        "test.near",
        "near_intents",
        "0x5ff8d1644ec46f23f1e3981831ed2ec3dd40c2ca",
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

    it("should accept any EVM address for NEAR network", async () => {
      const result = await validationRecipientAddress(
        authIdentity.authHandleToIntentsUserId(
          "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
          AuthMethod.Near
        ),
        "near"
      )
      expect(result.isOk()).toBe(true)
    })
  })

  describe("EVM networks", () => {
    it("should accept valid EVM address for eth", async () => {
      const result = await validationRecipientAddress(
        "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
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
