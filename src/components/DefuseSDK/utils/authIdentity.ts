import { keccak_256 } from "@noble/hashes/sha3"
import { base58, hex } from "@scure/base"
import type {
  AuthHandle,
  AuthIdentifier,
  AuthMethod,
} from "../types/authHandle"
import type { IntentsUserId } from "../types/intentsUserId"
import { assert } from "./assert"
import { parsePublicKey } from "./webAuthn"

/**
 * Converts a blockchain address to a standardized Defuse user ID.
 *
 * The conversion follows these rules:
 * 1. NEAR addresses: Used as-is (lowercased)
 *   - Explicit: "bob.near"
 *   - Implicit: "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"
 *
 * 2. EVM addresses: Used as-is (lowercased)
 *   - Format: "0xc0ffee254729296a45a3885639ac7e10f9d54979"
 *
 * 3. Solana addresses: Converted from base58 to hex
 *   - Input: base58 public key
 *   - Output: hex-encoded string
 *
 * 4. WebAuthn credentials: Converted based on curve type
 *   - P-256: Keccak256(prefix + pubkey) -> last 20 bytes -> hex with 0x prefix
 *   - Ed25519: Raw public key -> hex encoding
 *
 * @param authIdentifier - The user's identifier (blockchain address or WebAuthn public key)
 * @param authMethod - The type of credential ("evm", "near", "solana", "webauthn")
 * @returns A standardized Defuse user ID
 */
export function authHandleToIntentsUserId(
  authIdentifier: AuthIdentifier,
  authMethod: AuthMethod
): IntentsUserId
export function authHandleToIntentsUserId(authHandle: AuthHandle): IntentsUserId
export function authHandleToIntentsUserId(
  authIdentifier: AuthIdentifier | AuthHandle,
  authMethod?: AuthMethod
): IntentsUserId {
  let authHandle: AuthHandle
  if (typeof authIdentifier === "object") {
    authHandle = authIdentifier
  } else if (authMethod != null) {
    authHandle = {
      identifier: authIdentifier,
      method: authMethod,
    }
  } else {
    // This should never happen, because of argument types
    throw new Error("Invalid arguments")
  }

  const method = authHandle.method
  switch (method) {
    case "evm":
    case "near":
      return authHandle.identifier.toLowerCase() as IntentsUserId

    case "solana":
      return hex.encode(base58.decode(authHandle.identifier)) as IntentsUserId

    case "webauthn": {
      return webAuthnIdentifierToIntentsUserId(
        authHandle.identifier
      ) as IntentsUserId
    }

    case "ton": {
      assert(authHandle.identifier.length === 64)
      hex.decode(authHandle.identifier)
      return authHandle.identifier.toLowerCase() as IntentsUserId
    }

    default:
      method satisfies never
      throw new Error("Unsupported auth method")
  }
}

function webAuthnIdentifierToIntentsUserId(credential: string): string {
  const { curveType, publicKey } = parsePublicKey(credential)

  switch (curveType) {
    case "p256": {
      const p256 = new TextEncoder().encode("p256")
      const addressBytes = keccak_256(
        new Uint8Array([...p256, ...publicKey])
      ).slice(-20)

      // biome-ignore lint/style/useTemplate: it's fine
      return "0x" + hex.encode(addressBytes)
    }

    case "ed25519": {
      return hex.encode(publicKey)
    }

    default:
      curveType satisfies never
      throw new Error("Unsupported curve type")
  }
}
