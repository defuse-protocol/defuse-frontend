import { base64urlnopad } from "@scure/base"

export function encodeOrder(order: unknown): string {
  const format = {
    version: 1,
    payload: JSON.stringify(order),
  }
  return base64urlnopad.encode(new TextEncoder().encode(JSON.stringify(format)))
}

export function decodeOrder(encodedOrder: string): string {
  const json = new TextDecoder().decode(base64urlnopad.decode(encodedOrder))
  return JSON.parse(json).payload
}

export async function encodeAES256Order(
  order: unknown,
  key: string
): Promise<string> {
  validateKey(key)

  const format = {
    version: 1,
    payload: JSON.stringify(order),
  }
  const jsonString = JSON.stringify(format)
  const combined = await createEncryptedPayload(jsonString, key)
  return base64urlnopad.encode(combined)
}

export async function decodeAES256Order(
  encodedOrder: string,
  key: string
): Promise<string> {
  validateKey(key)

  try {
    const decoded = base64urlnopad.decode(encodedOrder)
    const { iv, ciphertext } = extractIVAndCiphertext(decoded)

    // Convert the key to a CryptoKey object
    const keyData = new TextEncoder().encode(key)
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    )

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      cryptoKey,
      ciphertext
    )

    const json = new TextDecoder().decode(decrypted)
    const parsed = JSON.parse(json)

    if (!parsed || typeof parsed.payload !== "string") {
      throw new Error("Invalid payload format")
    }
    return JSON.parse(parsed.payload)
  } catch (error) {
    console.error("Decryption error:", error)
    throw error
  }
}

async function createEncryptedPayload(
  jsonString: string,
  key: string
): Promise<Uint8Array> {
  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Convert the key to a CryptoKey object
  const keyData = new TextEncoder().encode(key)
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  )

  // Encrypt the data
  const data = new TextEncoder().encode(jsonString)
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    cryptoKey,
    data
  )

  // Combine IV and ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return combined
}

function extractIVAndCiphertext(data: Uint8Array): {
  iv: Uint8Array
  ciphertext: ArrayBuffer
} {
  const iv = data.slice(0, 12)
  const ciphertext = data.slice(12).buffer
  return { iv, ciphertext }
}

function validateKey(key: string): void {
  if (key.length !== 32) {
    throw new Error("Key must be 32-bytes")
  }
}
