import { blake2b } from "@noble/hashes/blake2b"
import { bech32m } from "@scure/base"

// ZIP-316, https://zips.z.cash/zip-0316 (Revision 0, the `u` prefix)
const HRP = "u"
const PADDING_LENGTH = 16
// F4Jumble's input range: the shortest is a transparent-only Revision 2 `tu` address
const F4JUMBLE_MIN = 38
const F4JUMBLE_MAX = 4_194_368
// Typecodes and lengths are CompactSize, at most Bitcoin's MAX_SIZE (as in librustzcash)
const MAX_COMPACT_SIZE = 0x02000000

const P2PKH = 0x00
const P2SH = 0x01
const SAPLING = 0x02
const ORCHARD = 0x03
const RECEIVER_LENGTH: Record<number, number> = {
  [P2PKH]: 20,
  [P2SH]: 20,
  [SAPLING]: 43,
  [ORCHARD]: 43,
}

/**
 * Validates Zcash mainnet unified addresses (ZIP-316 Revision 0, `u1…`).
 * Decodes the whole address: Bech32m (no 90-character limit), F4Jumble⁻¹,
 * the HRP padding, then the typecode-length-value items. A Revision 0
 * address must hold a Sapling or Orchard receiver, so a transparent-only one
 * is rejected, and no MUST-understand metadata; other items with typecodes we
 * don't know are ignored, as ZIP-316 requires. Returns true if valid, false if
 * invalid
 */
export function validateZcashUnifiedAddress(address: string): boolean {
  try {
    const { prefix, bytes } = bech32m.decodeToBytes(
      address as `${string}1${string}`
    )
    if (prefix !== HRP) return false

    const raw = f4jumbleInv(bytes)
    if (!hasPadding(raw.subarray(raw.length - PADDING_LENGTH))) return false

    const typecodes = readTypecodes(
      raw.subarray(0, raw.length - PADDING_LENGTH)
    )
    if (typecodes === null) return false
    if (typecodes.includes(P2PKH) && typecodes.includes(P2SH)) return false

    return typecodes.includes(SAPLING) || typecodes.includes(ORCHARD)
  } catch {
    return false
  }
}

/** The HRP, zero-padded to 16 bytes. */
function hasPadding(tail: Uint8Array): boolean {
  const expected = new Uint8Array(PADDING_LENGTH)
  expected.set(new TextEncoder().encode(HRP))
  return tail.every((byte, i) => byte === expected[i])
}

/**
 * The items' typecodes, or null if an item is truncated, out of order
 * (typecodes must strictly increase), a known receiver has the wrong length,
 * or an item is MUST-understand metadata, which Revision 0 does not allow.
 */
function readTypecodes(body: Uint8Array): number[] | null {
  const typecodes: number[] = []
  let at = 0
  while (at < body.length) {
    const typecode = readCompactSize(body, at)
    if (typecode === null) return null
    const length = readCompactSize(body, typecode.next)
    if (length === null) return null
    if (length.next + length.value > body.length) return null

    const previous = typecodes[typecodes.length - 1]
    if (previous !== undefined && typecode.value <= previous) return null

    const expected = RECEIVER_LENGTH[typecode.value]
    if (expected !== undefined && expected !== length.value) return null
    if (isMustUnderstand(typecode.value)) return null

    typecodes.push(typecode.value)
    at = length.next + length.value
  }
  return typecodes
}

/** ZIP-316 metadata typecodes 0xE0 to 0xFC are "MUST-understand". */
function isMustUnderstand(typecode: number): boolean {
  return typecode >= 0xe0 && typecode <= 0xfc
}

/**
 * A Bitcoin-style CompactSize; null if it runs past the end, is not in its
 * shortest form or is above MAX_COMPACT_SIZE.
 */
function readCompactSize(
  bytes: Uint8Array,
  at: number
): { value: number; next: number } | null {
  const first = bytes[at]
  if (first === undefined) return null
  if (first < 0xfd) return { value: first, next: at + 1 }

  const width = first === 0xfd ? 2 : first === 0xfe ? 4 : 8
  if (at + 1 + width > bytes.length) return null
  let value = 0
  for (let i = width; i >= 1; i--) value = value * 256 + (bytes[at + i] ?? 0)
  const shortest = first === 0xfd ? 0xfd : first === 0xfe ? 0x10000 : 2 ** 32
  if (value < shortest || value > MAX_COMPACT_SIZE) return null
  return { value, next: at + 1 + width }
}

const H_PERSONALIZATION = new TextEncoder().encode("UA_F4Jumble_H")
const G_PERSONALIZATION = new TextEncoder().encode("UA_F4Jumble_G")

/** Byte-wise XOR of `a` with `b`, the length of `a`. */
function xor(a: Uint8Array, b: Uint8Array): Uint8Array {
  return a.map((byte, i) => byte ^ (b[i] ?? 0))
}

/**
 * F4Jumble's H_i: BLAKE2b with a `length`-byte digest, personalized with
 * "UA_F4Jumble_H" and the bytes i, 0, 0.
 */
function f4H(i: number, u: Uint8Array, length: number): Uint8Array {
  return blake2b(u, {
    dkLen: length,
    personalization: Uint8Array.from([...H_PERSONALIZATION, i, 0, 0]),
  })
}

/**
 * F4Jumble's G_i: 64-byte BLAKE2b blocks j = 0, 1, …, each personalized with
 * "UA_F4Jumble_G", the byte i and j as 16-bit little-endian, cut to `length`.
 */
function f4G(i: number, u: Uint8Array, length: number): Uint8Array {
  const out = new Uint8Array(length)
  for (let j = 0; j * 64 < length; j++) {
    const block = blake2b(u, {
      dkLen: 64,
      personalization: Uint8Array.from([
        ...G_PERSONALIZATION,
        i,
        j & 0xff,
        j >> 8,
      ]),
    })
    out.set(block.subarray(0, Math.min(64, length - j * 64)), j * 64)
  }
  return out
}

/** The inverse of F4Jumble, ZIP-316's unkeyed 4-round Feistel construction. */
function f4jumbleInv(m: Uint8Array): Uint8Array {
  if (m.length < F4JUMBLE_MIN || m.length > F4JUMBLE_MAX) {
    throw new Error("F4Jumble input out of range")
  }
  const lengthL = Math.min(64, Math.floor(m.length / 2))
  const lengthR = m.length - lengthL
  const c = m.subarray(0, lengthL)
  const d = m.subarray(lengthL)
  const y = xor(c, f4H(1, d, lengthL))
  const x = xor(d, f4G(1, y, lengthR))
  const a = xor(y, f4H(0, x, lengthL))
  const b = xor(x, f4G(0, a, lengthR))
  return Uint8Array.from([...a, ...b])
}
