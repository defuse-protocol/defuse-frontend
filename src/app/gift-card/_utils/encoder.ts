import { base64urlnopad } from "@scure/base"

export function encodeSecretKey(secretKey: string): string {
  const format = {
    version: 1,
    payload: secretKey,
  }
  return base64urlnopad.encode(new TextEncoder().encode(JSON.stringify(format)))
}

export function decodeSecretKey(encodedSecretKey: string): string {
  const json = new TextDecoder().decode(base64urlnopad.decode(encodedSecretKey))
  return JSON.parse(json).payload
}
