import { base64, base64urlnopad } from "@scure/base"

export function encodeGift(gift: unknown): string {
  return base64urlnopad.encode(new TextEncoder().encode(JSON.stringify(gift)))
}

export function decodeGift(encodedGift: string): unknown {
  const json = new TextDecoder().decode(base64urlnopad.decode(encodedGift))
  const parsed = JSON.parse(json)
  return parsed?.payload ?? parsed
}

export async function encodeAES256Gift(
  order: unknown,
  pKey: string,
  iv: Uint8Array
): Promise<string> {
  validateKey(pKey)

  const format = {
    version: 1,
    payload: JSON.stringify(order),
  }
  const jsonString = JSON.stringify(format)
  const combined = await createEncryptedPayload(jsonString, pKey, iv)
  return base64.encode(combined)
}

export async function decodeAES256Gift(
  encodedGift: string,
  pKey: string,
  iv: string
): Promise<string> {
  validateKey(pKey)

  const decoded = base64.decode(encodedGift)
  const iv_ = base64urlnopad.decode(iv)

  // Convert the key to a CryptoKey object
  const keyBytes = base64urlnopad.decode(pKey)
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  )

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv_,
    },
    cryptoKey,
    decoded
  )

  const json = new TextDecoder().decode(decrypted)
  const parsed = JSON.parse(json)

  if (!parsed || typeof parsed.payload !== "string") {
    throw new Error("Invalid payload format")
  }
  return JSON.parse(parsed.payload)
}

async function createEncryptedPayload(
  jsonString: string,
  pKey: string,
  iv: Uint8Array
): Promise<Uint8Array> {
  // Convert the key to a CryptoKey object
  const keyBytes = base64urlnopad.decode(pKey)
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  )

  // Encrypt the data
  const data = new TextEncoder().encode(jsonString)
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    cryptoKey,
    data
  )

  return new Uint8Array(ciphertext)
}

function validateKey(pKey: string): void {
  try {
    const keyBytes = base64urlnopad.decode(pKey)
    if (keyBytes.length !== 32) {
      throw new Error("Key must be exactly 32 bytes (AES-256)")
    }
  } catch {
    throw new Error("Key must be exactly 32 bytes (AES-256)")
  }
}
