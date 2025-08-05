import { bech32 } from "@scure/base"

/**
 * Validates Cardano mainnet addresses (Base + Enterprise)
 * Returns true if valid, false if invalid
 */
export function validateCardanoAddress(address: string) {
  try {
    // max length big enough for any Cardano Bech32 addr
    const { prefix, words } = bech32.decode(
      address as `${string}1${string}`,
      120
    )

    // only mainnet
    if (prefix !== "addr") return false

    // convert 5-bit words back to bytes
    const data = bech32.fromWords(words)
    const addrType = data[0] >> 4

    return addrType >= 0 && addrType <= 7
  } catch {
    return false
  }
}
