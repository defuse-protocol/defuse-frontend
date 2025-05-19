import { base64urlnopad } from "@scure/base"

export function encodeGift(gift: unknown): string {
  return base64urlnopad.encode(new TextEncoder().encode(JSON.stringify(gift)))
}

export function decodeGift(encodedGift: string): string {
  const json = new TextDecoder().decode(base64urlnopad.decode(encodedGift))
  const parsed = JSON.parse(json)
  return parsed.payload ?? parsed // check payload for backwards compatibility
}
