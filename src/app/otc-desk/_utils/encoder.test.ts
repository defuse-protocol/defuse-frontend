import { ENCRYPTION_KEY } from "@src/utils/environment"
import { describe, expect, it } from "vitest"
import { decodeAES256Order, encodeAES256Order } from "./encoder"

describe("encoder", () => {
  const testPayload = {
    test: "data",
    number: 123,
  }

  it("should verify encryption/decryption with environment key", () => {
    // Log the key being used
    console.log("Using ENCRYPTION_KEY:", ENCRYPTION_KEY)

    // Test encryption and decryption
    const encrypted = encodeAES256Order(testPayload, ENCRYPTION_KEY)
    console.log("Encrypted:", encrypted)

    const decrypted = decodeAES256Order(encrypted, ENCRYPTION_KEY)
    console.log("Decrypted:", decrypted)

    expect(decrypted).toEqual(testPayload)
  })
})
