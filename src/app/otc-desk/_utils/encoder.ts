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
