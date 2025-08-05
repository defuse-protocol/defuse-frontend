import { authHandleToIntentsUserId } from "@src/components/DefuseSDK/utils/authIdentity"
import { describe, expect, it } from "vitest"
import { AuthMethod } from "../../../../../../types"
import { validateAddressSoft } from "./validation"

describe("validateAddressSoft", () => {
  describe("Near Intents network", () => {
    it("should accept valid NEAR address", () => {
      const result = validateAddressSoft(
        "recipient.near",
        "near_intents",
        "valid-recipient.near",
        AuthMethod.Near
      )
      expect(result).toBeNull()
    })
    it("should reject invalid NEAR address", () => {
      const result = validateAddressSoft(
        "invalid_near-",
        "near_intents",
        "valid-recipient.near",
        AuthMethod.Near
      )
      expect(result).toBe(
        "Please enter a valid address for the selected blockchain."
      )
    })
    it("should reject self NEAR address", () => {
      const result = validateAddressSoft(
        "valid-recipient.near",
        "near_intents",
        "valid-recipient.near",
        AuthMethod.Near
      )
      expect(result).toBe(
        "You cannot withdraw to your own address. Please enter a different recipient address."
      )
    })

    it("should accept valid WebAuthn address", () => {
      const webAuthnPublicKey =
        "p256:3NSY8SFTWoPFMrTGdLVqPogirCyt3kMnUajXoDQuVeCsA6wzkMMp5whBqymAPM7xFiBthDKueiUv1zVAj7GDT8rQ"
      const result = validateAddressSoft(
        "valid-recipient.near",
        "near_intents",
        authHandleToIntentsUserId(webAuthnPublicKey, AuthMethod.WebAuthn),
        AuthMethod.Near
      )
      expect(result).toBeNull()
    })
    it("should reject self WebAuthn address", () => {
      const webAuthnPublicKey =
        "p256:3NSY8SFTWoPFMrTGdLVqPogirCyt3kMnUajXoDQuVeCsA6wzkMMp5whBqymAPM7xFiBthDKueiUv1zVAj7GDT8rQ"
      const userAddress = authHandleToIntentsUserId(
        webAuthnPublicKey,
        AuthMethod.WebAuthn
      )
      const result = validateAddressSoft(
        userAddress,
        "near_intents",
        userAddress,
        AuthMethod.Near
      )
      expect(result).toBe(
        "You cannot withdraw to your own address. Please enter a different recipient address."
      )
    })

    it("should accept valid EVM address", () => {
      const result = validateAddressSoft(
        "valid-recipient.near",
        "near_intents",
        "0x5ff8d1644ec46f23f1e3981831ed2ec3dd40c2ca",
        AuthMethod.Near
      )
      expect(result).toBeNull()
    })
    it("should reject self EVM address", () => {
      const userAddress = "0x5ff8d1644ec46f23f1e3981831ed2ec3dd40c2ca"
      const result = validateAddressSoft(
        userAddress,
        "near_intents",
        userAddress,
        AuthMethod.Near
      )
      expect(result).toBe(
        "You cannot withdraw to your own address. Please enter a different recipient address."
      )
    })

    it("should accept valid Solana address", () => {
      const userAddress = "DRpbCBMxVnDK7maPGv7vhuYme3jNdBAt4YHw2wKgqWPU"
      const result = validateAddressSoft(
        "valid-recipient.near",
        "near_intents",
        authHandleToIntentsUserId(userAddress, AuthMethod.Solana),
        AuthMethod.Near
      )
      expect(result).toBeNull()
    })
    it("should reject self Solana address", () => {
      const userAddress = authHandleToIntentsUserId(
        "DRpbCBMxVnDK7maPGv7vhuYme3jNdBAt4YHw2wKgqWPU",
        AuthMethod.Solana
      )
      const result = validateAddressSoft(
        userAddress,
        "near_intents",
        userAddress,
        AuthMethod.Near
      )
      expect(result).toBe(
        "You cannot withdraw to your own address. Please enter a different recipient address."
      )
    })

    it("should accept valid Ton address", () => {
      const userAddress =
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
      const result = validateAddressSoft(
        "valid-recipient.near",
        "near_intents",
        authHandleToIntentsUserId(userAddress, AuthMethod.Ton),
        AuthMethod.Near
      )
      expect(result).toBeNull()
    })
    it("should reject self Ton address", () => {
      const userAddress = authHandleToIntentsUserId(
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        AuthMethod.Ton
      )
      const result = validateAddressSoft(
        userAddress,
        "near_intents",
        userAddress,
        AuthMethod.Near
      )
      expect(result).toBe(
        "You cannot withdraw to your own address. Please enter a different recipient address."
      )
    })
  })

  describe("NEAR network", () => {
    it("should accept valid NEAR address", () => {
      const result = validateAddressSoft("valid-recipient.near", "near")
      expect(result).toBeNull()
    })

    it("should accept EVM address for NEAR network", () => {
      const result = validateAddressSoft(
        authHandleToIntentsUserId(
          "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
          AuthMethod.Near
        ),
        "near"
      )
      expect(result).toBeNull()
    })

    it("should accept any EVM address for NEAR network", () => {
      const result = validateAddressSoft(
        authHandleToIntentsUserId("0xd", AuthMethod.Near), // TODO: this is invalid EVM address
        "near"
      )
      expect(result).toBeNull()
    })
  })

  describe("EVM networks", () => {
    it("should accept valid EVM address for eth", () => {
      const result = validateAddressSoft(
        "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
        "eth"
      )
      expect(result).toBeNull()
    })

    it("should reject invalid EVM address", () => {
      const result = validateAddressSoft("0xd", "eth")
      expect(result).toBe(
        "Please enter a valid address for the selected blockchain."
      )
    })
  })

  describe("Solana network", () => {
    it("should accept valid Solana address", () => {
      const result = validateAddressSoft(
        "DRpbCBMxVnDK7maPGv7vhuYme3jNdBAt4YHw2wKgqWPU",
        "solana"
      )
      expect(result).toBeNull()
    })

    it("should reject invalid Solana address", () => {
      const result = validateAddressSoft("invalid_solana", "solana")
      expect(result).toBe(
        "Please enter a valid address for the selected blockchain."
      )
    })
  })

  describe("Ton network", () => {
    it("should accept valid Ton address", () => {
      const result = validateAddressSoft(
        "EQCz7_vtRwQWnKPYVb-JBl8WqF6MdwypKBT1KCeZzvS7DQdD",
        "ton"
      )
      expect(result).toBeNull()
    })

    it("should reject invalid Ton address", () => {
      const result = validateAddressSoft("invalid_ton", "ton")
      expect(result).toBe(
        "Please enter a valid address for the selected blockchain."
      )
    })
  })

  describe("Edge cases", () => {
    it("should handle empty address", () => {
      const result = validateAddressSoft("", "near")
      expect(result).toBe(
        "Please enter a valid address for the selected blockchain."
      )
    })

    it("should handle whitespace-only address", () => {
      const result = validateAddressSoft(" ", "near")
      expect(result).toBe(
        "Please enter a valid address for the selected blockchain."
      )
    })
  })
})
