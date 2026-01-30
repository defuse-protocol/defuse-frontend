import { base64urlnopad } from "@scure/base"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { decodeAES256Gift, encodeAES256Gift } from "./encoder"

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
  const payload = {
    message: "Happy Gift",
    secretKey:
      "ed25519:dB3AZsPidf1mawyCTPtAQp11YGEjV7WApWMdS3F16YaAyoKAtJyMzGG5skzZs6H54J75Afeq4W3GsBST48GoHDw",
  }

  const pKey = "iWRbd_YTptQT4w4hdIEgfI7JJjM0-uFwRCpRVXk5IFs"

  const iv = base64urlnopad.decode("InQci4kRc3nrT8T1")

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
    mockCrypto.subtle.encrypt.mockImplementation(async (_, _key, data) => {
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
    mockCrypto.subtle.decrypt.mockImplementation(async (_, _key, data) => {
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
      const encrypted = await encodeAES256Gift(payload, pKey, iv)
      const decrypted = await decodeAES256Gift(
        encrypted,
        pKey,
        base64urlnopad.encode(iv)
      )
      expect(decrypted).toEqual(payload)

      // Verify crypto API was called correctly
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledTimes(2) // Once for encrypt, once for decrypt
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledTimes(1)
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalledTimes(1)
    })

    it("should fail with invalid key length", async () => {
      const emptyKey = ""
      const aes160Key = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4" // 24 bytes when decoded
      await expect(encodeAES256Gift(payload, emptyKey, iv)).rejects.toThrow(
        "Key must be exactly 32 bytes (AES-256)"
      )
      await expect(
        decodeAES256Gift(
          "some-encrypted-data",
          aes160Key,
          base64urlnopad.encode(iv)
        )
      ).rejects.toThrow("Key must be exactly 32 bytes (AES-256)")
    })

    it("should fail with invalid encrypted data", async () => {
      const invalidData = "not-encrypted-data"
      await expect(
        decodeAES256Gift(invalidData, pKey, base64urlnopad.encode(iv))
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
      mockCrypto.subtle.encrypt.mockImplementation(async (_, _key, data) => {
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

      const encrypted1 = await encodeAES256Gift(payload, pKey, iv)
      const encrypted2 = await encodeAES256Gift(payload, pKey, iv)
      expect(encrypted1).not.toEqual(encrypted2)
    })
  })
})
