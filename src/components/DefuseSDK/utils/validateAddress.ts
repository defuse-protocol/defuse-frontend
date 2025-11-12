import { utils } from "@defuse-protocol/internal-utils"
import { sha256 } from "@noble/hashes/sha256"
import { base58, bech32, bech32m, hex } from "@scure/base"
import { PublicKey } from "@solana/web3.js"
import {
  isValidClassicAddress as xrp_isValidClassicAddress,
  isValidXAddress as xrp_isValidXAddress,
} from "ripple-address-codec"
import type { SupportedChainName } from "../types/base"
import { validateCardanoAddress } from "./addressValidation/cardano"

export function validateAddress(
  address: string,
  blockchain: SupportedChainName
): boolean {
  switch (blockchain) {
    case "near":
      return utils.validateNearAddress(address)
    case "eth":
    case "base":
    case "arbitrum":
    case "turbochain":
    case "tuxappchain":
    case "vertex":
    case "optima":
    case "easychain":
    case "aurora":
    case "aurora_devnet":
    case "gnosis":
    case "berachain":
    case "polygon":
    case "bsc":
    case "hyperliquid":
    case "optimism":
    case "avalanche":
    case "layerx":
      return validateEthAddress(address)
    case "bitcoin":
      return validateBtcAddress(address)

    case "solana":
      return validateSolAddress(address)

    case "dogecoin":
      return validateDogeAddress(address)

    case "xrpledger":
      return validateXrpAddress(address)

    case "zcash":
      return validateZcashAddress(address)

    case "tron":
      return validateTronAddress(address)

    case "ton":
      return validateTonAddress(address)

    case "sui":
      return validateSuiAddress(address)

    case "stellar":
      return validateStellarAddress(address)

    case "aptos":
      return validateAptosAddress(address)

    case "cardano":
      return validateCardanoAddress(address)

    case "litecoin":
      return validateLitecoinAddress(address)

    default:
      blockchain satisfies never
      return false
  }
}

// todo: Do we need to check checksum?
function validateEthAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

function validateBtcAddress(address: string) {
  return (
    /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address) ||
    /^3[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address) ||
    /^bc1[02-9ac-hj-np-z]{11,87}$/.test(address) ||
    /^bc1p[02-9ac-hj-np-z]{42,87}$/.test(address)
  )
}

function validateSolAddress(address: string) {
  try {
    return PublicKey.isOnCurve(address)
  } catch {
    return false
  }
}

function validateDogeAddress(address: string) {
  return /^[DA][1-9A-HJ-NP-Za-km-z]{25,33}$/.test(address)
}

function validateXrpAddress(address: string) {
  return xrp_isValidClassicAddress(address) || xrp_isValidXAddress(address)
}

/**
 * Validates Zcash addresses
 * Supports:
 * - Transparent addresses (t1, t3)
 * - TEX addresses (tex1)
 */
function validateZcashAddress(address: string) {
  // Transparent address validation
  if (address.startsWith("t1") || address.startsWith("t3")) {
    // t1 for P2PKH addresses, t3 for P2SH addresses
    return /^t[13][a-km-zA-HJ-NP-Z1-9]{33}$/.test(address)
  }

  // TEX address validation
  const expectedHrp = "tex"
  if (address.startsWith(`${expectedHrp}1`)) {
    try {
      const decoded = bech32m.decodeToBytes(address)
      if (decoded.prefix !== expectedHrp) {
        return false
      }
      return decoded.bytes.length === 20
    } catch {
      return false
    }
  }

  // Unified address validation
  const uaHrp = "u"
  if (address.startsWith(`${uaHrp}1`)) {
    try {
      const decoded = bech32m.decodeToBytes(address)
      return decoded.prefix === uaHrp
    } catch {
      return false
    }
  }

  return false
}

/**
 * Validates Tron addresses
 * Supports:
 * - hex addresses
 * - base58 addresses
 * https://developers.tron.network/docs/account
 */
function validateTronAddress(address: string): boolean {
  return validateTronBase58Address(address) || validateTronHexAddress(address)
}

function validateTronBase58Address(address: string): boolean {
  try {
    const decoded = base58.decode(address)

    if (decoded.length !== 25) return false

    // The first 21 bytes are the address data, the last 4 bytes are the checksum.
    const data = decoded.slice(0, 21)
    const checksum = decoded.slice(21)

    const expectedChecksum = sha256(sha256(data)).slice(0, 4)
    for (let i = 0; i < 4; i++) {
      if (checksum[i] !== expectedChecksum[i]) return false
    }

    return data[0] === 0x41
  } catch {
    return false
  }
}

function validateTronHexAddress(address: string): boolean {
  try {
    const decoded = hex.decode(address)
    return decoded.length === 21 && decoded[0] === 0x41
  } catch {
    return false
  }
}

function validateTonAddress(address: string) {
  return /^[EU]Q[0-9A-Za-z_-]{46}$/.test(address)
}

function validateSuiAddress(address: string) {
  return /^(?:0x)?[a-fA-F0-9]{64}$/.test(address)
}

function validateStellarAddress(address: string) {
  return /^G[A-Z0-9]{55}$/.test(address)
}

function validateAptosAddress(address: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(address)
}

// This is copy from https://github.com/defuse-protocol/sdk-monorepo/blob/00f01151dac03d182d7d92545af8cddb673c1301/packages/intents-sdk/src/lib/validateAddress.ts#L252
// TODO: We should take it from the SDK package
function validateLitecoinAddress(address: string): boolean {
  const first = address[0]

  // ---- Base58 (mainnet) ----

  // P2PKH: L... (0x30)
  if (first === "L") {
    return validateLitecoinBase58Address(address, 0x30)
  }

  // P2SH (new): M... (0x32)
  if (first === "M") {
    return validateLitecoinBase58Address(address, 0x32)
  }

  // P2SH (legacy): 3... (0x05)
  // [Inference] This also matches Bitcoin P2SH; cannot distinguish by prefix+version alone.
  if (first === "3") {
    return validateLitecoinBase58Address(address, 0x05)
  }

  // ---- Bech32 / Bech32m (SegWit) ----

  const lower = address.toLowerCase()
  if (!lower.startsWith("ltc1")) {
    return false
  }

  return validateLitecoinBech32Address(address)
}

function validateLitecoinBase58Address(
  address: string,
  expectedVersion: number
): boolean {
  let decoded: Uint8Array

  try {
    decoded = base58.decode(address)
  } catch {
    return false
  }

  // version (1) + payload (20) + checksum (4)
  if (decoded.length !== 25) return false

  const version = decoded[0]
  if (version !== expectedVersion) return false

  const payload = decoded.subarray(0, 21) // version + hash160
  const checksum = decoded.subarray(21, 25)

  const hash1 = sha256(payload)
  const hash2 = sha256(hash1)
  const expectedChecksum = hash2.subarray(0, 4)

  for (let i = 0; i < 4; i++) {
    if (checksum[i] !== expectedChecksum[i]) return false
  }

  return true
}

function validateLitecoinBech32Address(address: string): boolean {
  let decoded: {
    prefix: string
    words: number[]
  }
  let isBech32m = false

  try {
    // Try Bech32 (v0)
    decoded = bech32.decode(address as `${string}1${string}`)
  } catch {
    try {
      // If Bech32 failed, try Bech32m (v1+)
      decoded = bech32m.decode(address as `${string}1${string}`)
      isBech32m = true
    } catch {
      return false
    }
  }

  // HRP must be "ltc" (case-insensitive)
  if (decoded.prefix.toLowerCase() !== "ltc") return false

  const { words } = decoded
  if (!words || words.length < 1) return false

  const version = words[0]
  if (version == null || version < 0 || version > 16) return false

  const program = bech32.fromWords(words.slice(1))
  const progLen = program.length

  // Generic SegWit constraints
  if (progLen < 2 || progLen > 40) return false

  // v0: Bech32 only, 20 or 32 bytes
  if (version === 0) {
    if (isBech32m) return false
    return progLen === 20 || progLen === 32
  }

  // v1 (Taproot on LTC): Bech32m only, 32 bytes
  if (version === 1) {
    if (!isBech32m) return false
    return progLen === 32
  }

  // Other versions
  return false
}
