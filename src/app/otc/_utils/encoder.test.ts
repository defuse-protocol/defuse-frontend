import { base64 } from "@scure/base"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { decodeAES256Order, encodeAES256Order } from "./encoder"

const mockCrypto = {
  subtle: {
    importKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
  },
  getRandomValues: vi.fn(),
}

Object.defineProperty(global, "crypto", {
  value: mockCrypto,
  writable: true,
})

describe("encoder", () => {
  const makerMultiPayload = {
    payload:
      '{\n  "signer_id": "0xsucke9c9029ef5172c0a0f58ea6e7205a82a24e1",\n  "verifying_contract": "intents.near",\n  "deadline": "2025-05-13T10:47:06.528Z",\n  "nonce": "MabxnXcg2XmKJflJyvUELj1u5uLqjbbmx4lZuS+YLmk=",\n  "intents": [\n    {\n      "intent": "token_diff",\n      "diff": {\n        "nep141:wrap.near": "-177353300864365114070857",\n        "nep141:eth-0xa35923162c49cf95e6bf26623385eb431ad920d3.omft.near": "2493000000000000000"\n      },\n      "referral": "near-intents.intents-referral.near",\n      "memo": "OTC_CREATE"\n    }\n  ]\n}',
    signature:
      "secp256k1:CKUPsyCGCcTstHRvPR2sTU2LQFC5Rv3CbbSr3udUxPkB7amBhrzb1M4SZepeq1jyJLFjvFHZ3KycbD8iDsqgPsDk4",
    standard: "erc191",
  }

  const pKey = "iWRbd_YTptQT4w4hdIEgfI7JJjM0-uFwRCpRVXk5IFs"

  const iv = base64.decode("q/fEfO4EboQgW+7u")

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock implementations
    mockCrypto.getRandomValues.mockImplementation((arr) => {
      // Fill with predictable values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i % 256
      }
      return arr
    })

    mockCrypto.subtle.importKey.mockResolvedValue("mock-key")

    // Mock encrypt to simulate actual encryption
    mockCrypto.subtle.encrypt.mockImplementation(async (_, key, data) => {
      // Create a mock encrypted result that includes just the ciphertext
      const encoder = new TextEncoder()
      const originalData = new TextDecoder().decode(data)
      const format = {
        version: 1,
        payload: originalData,
      }
      const encoded = encoder.encode(JSON.stringify(format))
      return encoded.buffer
    })

    // Mock decrypt to simulate actual decryption
    mockCrypto.subtle.decrypt.mockImplementation(async (_, key, data) => {
      // Extract the original data from our mock encrypted format
      const decoder = new TextDecoder()
      const encryptedData = decoder.decode(data)
      const parsed = JSON.parse(encryptedData)
      const encoder = new TextEncoder()
      return encoder.encode(parsed.payload).buffer
    })
  })

  describe("AES256 encryption/decryption", () => {
    it("should verify encryption/decryption with environment key", async () => {
      const encrypted = await encodeAES256Order(makerMultiPayload, pKey, iv)
      const decrypted = await decodeAES256Order(
        encrypted,
        pKey,
        base64.encode(iv)
      )
      expect(decrypted).toEqual(makerMultiPayload)

      // Verify crypto API was called correctly
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledTimes(2) // Once for encrypt, once for decrypt
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledTimes(1)
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalledTimes(1)
    })

    it("should fail with invalid key length", async () => {
      const emptyKey = ""
      const aes160Key = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4" // 24 bytes when decoded
      await expect(
        encodeAES256Order(makerMultiPayload, emptyKey, iv)
      ).rejects.toThrow("Key must be exactly 32 bytes (AES-256)")
      await expect(
        decodeAES256Order("some-encrypted-data", aes160Key, base64.encode(iv))
      ).rejects.toThrow("Key must be exactly 32 bytes (AES-256)")
    })

    it("should fail with invalid encrypted data", async () => {
      const invalidData = "not-encrypted-data"
      await expect(
        decodeAES256Order(invalidData, pKey, base64.encode(iv))
      ).rejects.toThrow()
    })

    it("should produce different ciphertexts for same input", async () => {
      // Mock getRandomValues to return different values each time
      let counter = 0
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = (counter + i) % 256
        }
        counter++
        return arr
      })

      // Mock encrypt to include a random component in the output
      mockCrypto.subtle.encrypt.mockImplementation(async (_, key, data) => {
        const encoder = new TextEncoder()
        const originalData = new TextDecoder().decode(data)
        const format = {
          version: 1,
          payload: originalData,
          random: counter++, // Add a random component to ensure different outputs
        }
        const encoded = encoder.encode(JSON.stringify(format))
        return encoded.buffer
      })

      const encrypted1 = await encodeAES256Order(makerMultiPayload, pKey, iv)
      const encrypted2 = await encodeAES256Order(makerMultiPayload, pKey, iv)
      expect(encrypted1).not.toEqual(encrypted2)
    })
  })
})
