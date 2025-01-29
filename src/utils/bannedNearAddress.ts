import addresses from "../gen/bannedNearAddress.json" with { type: "json" }

const bannedNearAddress = new Set(addresses)

export function isBannedNearAddress(address: string): boolean {
  return bannedNearAddress.has(address.toLowerCase())
}
