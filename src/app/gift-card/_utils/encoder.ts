import { base64urlnopad } from "@scure/base"

export function encodeGift(gift: unknown): string {
  const format = {
    version: 1,
    payload: gift,
  }
  return base64urlnopad.encode(new TextEncoder().encode(JSON.stringify(format)))
}

export function decodeGift(encodedGift: string): string {
  const json = new TextDecoder().decode(base64urlnopad.decode(encodedGift))
  return JSON.parse(json).payload
}
