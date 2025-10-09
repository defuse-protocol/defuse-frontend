import { AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import { describe, expect, it } from "vitest"
import { validationRecipientAddress } from "./validationRecipientAddress"

describe("validationRecipientAddress", () => {
  describe("Near Intents network", () => {
    it("should accept valid NEAR address", () => {
      const result = validationRecipientAddress(
        "recipient.near",
        "near_intents",
        "valid-recipient.near",
        AuthMethod.Near
      )
      expect(result.isOk()).toBe(true)
    })
    it("should reject invalid NEAR address", () => {
      const result = validationRecipientAddress(
        "invalid_near-",
        "near_intents",
        "valid-recipient.near",
        AuthMethod.Near
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
    it("should reject self NEAR address", () => {
      const result = validationRecipientAddress(
        "valid-recipient.near",
        "near_intents",
        "valid-recipient.near",
        AuthMethod.Near
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("SELF_WITHDRAWAL")
    })

    it("should accept valid WebAuthn address", () => {
      const webAuthnPublicKey =
        "p256:3NSY8SFTWoPFMrTGdLVqPogirCyt3kMnUajXoDQuVeCsA6wzkMMp5whBqymAPM7xFiBthDKueiUv1zVAj7GDT8rQ"
      const result = validationRecipientAddress(
        "valid-recipient.near",
        "near_intents",
        authIdentity.authHandleToIntentsUserId(
          webAuthnPublicKey,
          AuthMethod.WebAuthn
        ),
        AuthMethod.Near
      )
      expect(result.isOk()).toBe(true)
    })
    it("should reject self WebAuthn address", () => {
      const webAuthnPublicKey =
        "p256:3NSY8SFTWoPFMrTGdLVqPogirCyt3kMnUajXoDQuVeCsA6wzkMMp5whBqymAPM7xFiBthDKueiUv1zVAj7GDT8rQ"
      const userAddress = authIdentity.authHandleToIntentsUserId(
        webAuthnPublicKey,
        AuthMethod.WebAuthn
      )
      const result = validationRecipientAddress(
        userAddress,
        "near_intents",
        userAddress,
        AuthMethod.Near
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("SELF_WITHDRAWAL")
    })

    it("should accept valid EVM address", () => {
      const result = validationRecipientAddress(
        "valid-recipient.near",
        "near_intents",
        "0x5ff8d1644ec46f23f1e3981831ed2ec3dd40c2ca",
        AuthMethod.Near
      )
      expect(result.isOk()).toBe(true)
    })
    it("should reject self EVM address", () => {
      const userAddress = "0x5ff8d1644ec46f23f1e3981831ed2ec3dd40c2ca"
      const result = validationRecipientAddress(
        userAddress,
        "near_intents",
        userAddress,
        AuthMethod.Near
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("SELF_WITHDRAWAL")
    })

    it("should accept valid Solana address", () => {
      const userAddress = "DRpbCBMxVnDK7maPGv7vhuYme3jNdBAt4YHw2wKgqWPU"
      const result = validationRecipientAddress(
        "valid-recipient.near",
        "near_intents",
        authIdentity.authHandleToIntentsUserId(userAddress, AuthMethod.Solana),
        AuthMethod.Near
      )
      expect(result.isOk()).toBe(true)
    })
    it("should reject self Solana address", () => {
      const userAddress = authIdentity.authHandleToIntentsUserId(
        "DRpbCBMxVnDK7maPGv7vhuYme3jNdBAt4YHw2wKgqWPU",
        AuthMethod.Solana
      )
      const result = validationRecipientAddress(
        userAddress,
        "near_intents",
        userAddress,
        AuthMethod.Near
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("SELF_WITHDRAWAL")
    })

    it("should accept valid Ton address", () => {
      const userAddress =
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
      const result = validationRecipientAddress(
        "valid-recipient.near",
        "near_intents",
        authIdentity.authHandleToIntentsUserId(userAddress, AuthMethod.Ton),
        AuthMethod.Near
      )
      expect(result.isOk()).toBe(true)
    })
    it("should reject self Ton address", () => {
      const userAddress = authIdentity.authHandleToIntentsUserId(
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        AuthMethod.Ton
      )
      const result = validationRecipientAddress(
        userAddress,
        "near_intents",
        userAddress,
        AuthMethod.Near
      )
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("SELF_WITHDRAWAL")
    })
  })

  describe("NEAR network", () => {
    it("should accept valid NEAR address", () => {
      const result = validationRecipientAddress("valid-recipient.near", "near")
      expect(result.isOk()).toBe(true)
    })

    it("should accept EVM address for NEAR network", () => {
      const result = validationRecipientAddress(
        authIdentity.authHandleToIntentsUserId(
          "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
          AuthMethod.Near
        ),
        "near"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should accept any EVM address for NEAR network", () => {
      const result = validationRecipientAddress(
        authIdentity.authHandleToIntentsUserId("0xd", AuthMethod.Near), // TODO: this is invalid EVM address
        "near"
      )
      expect(result.isOk()).toBe(true)
    })
  })

  describe("EVM networks", () => {
    it("should accept valid EVM address for eth", () => {
      const result = validationRecipientAddress(
        "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
        "eth"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid EVM address", () => {
      const result = validationRecipientAddress("0xd", "eth")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Solana network", () => {
    it("should accept valid Solana address", () => {
      const result = validationRecipientAddress(
        "DRpbCBMxVnDK7maPGv7vhuYme3jNdBAt4YHw2wKgqWPU",
        "solana"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid Solana address", () => {
      const result = validationRecipientAddress("invalid_solana", "solana")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Ton network", () => {
    it("should accept valid Ton address", () => {
      const result = validationRecipientAddress(
        "EQCz7_vtRwQWnKPYVb-JBl8WqF6MdwypKBT1KCeZzvS7DQdD",
        "ton"
      )
      expect(result.isOk()).toBe(true)
    })

    it("should reject invalid Ton address", () => {
      const result = validationRecipientAddress("invalid_ton", "ton")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })

  describe("Edge cases", () => {
    it("should handle empty address", () => {
      const result = validationRecipientAddress("", "near")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })

    it("should handle whitespace-only address", () => {
      const result = validationRecipientAddress(" ", "near")
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe("ADDRESS_INVALID")
    })
  })
})
