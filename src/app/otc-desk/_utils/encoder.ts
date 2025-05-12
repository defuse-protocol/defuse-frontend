import { base64urlnopad } from "@scure/base"
import * as c from "crypto-js"

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

export function encodeAES256Order(order: unknown, key: string): string {
  validateKey(key)

  const format = {
    version: 1,
    payload: JSON.stringify(order),
  }
  const jsonString = JSON.stringify(format)
  const combined = createEncryptedPayload(jsonString, key)
  const bytes = wordArrayToUint8Array(combined)
  return base64urlnopad.encode(bytes)
}

export function decodeAES256Order(encodedOrder: string, key: string): string {
  validateKey(key)

  try {
    const decoded = base64urlnopad.decode(encodedOrder)
    const wordArray = uint8ArrayToWordArray(decoded)
    const { iv, ciphertext } = extractIVAndCiphertext(wordArray)
    const keyWordArray = c.enc.Utf8.parse(key)

    const cipherParams = c.lib.CipherParams.create({
      ciphertext: ciphertext,
    })

    const decrypted = c.AES.decrypt(cipherParams, keyWordArray, {
      iv: iv,
      mode: c.mode.CBC,
      padding: c.pad.Pkcs7,
    })

    const json = decrypted.toString(c.enc.Utf8)
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

function wordArrayToUint8Array(wordArray: c.lib.WordArray): Uint8Array {
  const bytes = new Uint8Array(wordArray.sigBytes)
  for (let i = 0; i < wordArray.sigBytes; i++) {
    bytes[i] = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
  }
  return bytes
}

function uint8ArrayToWordArray(bytes: Uint8Array): c.lib.WordArray {
  const wordArray = c.lib.WordArray.create()
  wordArray.sigBytes = bytes.length
  wordArray.words = new Array(Math.ceil(bytes.length / 4))

  for (let i = 0; i < bytes.length; i++) {
    wordArray.words[i >>> 2] |= (bytes[i] & 0xff) << (24 - (i % 4) * 8)
  }
  return wordArray
}

function createEncryptedPayload(
  jsonString: string,
  key: string
): c.lib.WordArray {
  const iv = c.lib.WordArray.random(16)
  const keyWordArray = c.enc.Utf8.parse(key)

  const encrypted = c.AES.encrypt(jsonString, keyWordArray, {
    iv: iv,
    mode: c.mode.CBC,
    padding: c.pad.Pkcs7,
  })

  return iv.concat(encrypted.ciphertext)
}

function extractIVAndCiphertext(wordArray: c.lib.WordArray): {
  iv: c.lib.WordArray
  ciphertext: c.lib.WordArray
} {
  const iv = c.lib.WordArray.create(wordArray.words.slice(0, 4))
  iv.sigBytes = 16
  const ciphertext = c.lib.WordArray.create(wordArray.words.slice(4))
  ciphertext.sigBytes = wordArray.sigBytes - 16
  return { iv, ciphertext }
}

function validateKey(key: string): void {
  if (key.length !== 32) {
    throw new Error("Key must be 32-bytes")
  }
}
