"use client"

import { SwapWidget } from "@defuse-protocol/defuse-sdk"
import { base58 } from "@scure/base"
import Button from "@src/components/Button/Button"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useCurrentPasskey } from "@src/stores/passkeyStore"

export default function WebAuthnExamplePage() {
  const { credential, setCredential, clearCredential, knownCredentials } =
    useCurrentPasskey()

  const handleClickSignIn = async () => {
    // Do nothing if already signed in
    if (credential != null) return

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        allowCredentials: [],
        timeout: 60000,
      },
    })

    if (!(assertion instanceof PublicKeyCredential)) {
      console.error("Invalid assertion type")
      return
    }

    // todo: obtain public key from persistent storage
    const found = knownCredentials.find((cred) => {
      return cred.rawId === base58.encode(new Uint8Array(assertion.rawId))
    })

    if (found == null) {
      // At this point user lost their public key :(
      // Ideally this should never happen
      console.error("Cannot find public key for the given credential")

      return
    }

    setCredential(found)
  }

  const handleClickNew = async () => {
    // Do nothing if already signed in
    if (credential != null) return

    // Format current date as "Feb 12 14:30"
    const formattedDate = new Date().toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
      {
        challenge: new Uint8Array(32),
        rp: { name: "Example" }, // todo: use actual RP name
        user: {
          id: crypto.getRandomValues(new Uint8Array(32)),
          name: `User ${formattedDate}`,
          displayName: `User ${formattedDate}`,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -8 },
          { type: "public-key", alg: -7 },
        ],
        timeout: 60000,
        attestation: "direct",
      }

    const attestation = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })

    if (
      !(attestation instanceof PublicKeyCredential) ||
      !(attestation.response instanceof AuthenticatorAttestationResponse)
    ) {
      console.error("Invalid attestation type")
      return
    }

    const pubKey = attestation.response.getPublicKey()

    if (pubKey == null) {
      console.error("Public key is null")
      return
    }

    const algorithm = attestation.response.getPublicKeyAlgorithm()
    const rawPublicKey = await parseWebAuthnPublicKey(
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      attestation.response.getPublicKey()!,
      algorithm
    )

    // todo: save public key to persistent storage
    setCredential({
      rawId: base58.encode(new Uint8Array(attestation.rawId)),
      publicKey: formatPublicKey(rawPublicKey, algorithm),
    })
  }

  const handleClickSignOut = () => {
    clearCredential()
  }

  return (
    <div>
      <Button type={"button"} onClick={handleClickNew}>
        Create new
      </Button>

      <Button type={"button"} onClick={handleClickSignIn}>
        Sign In
      </Button>

      <Button type={"button"} onClick={handleClickSignOut}>
        Sign Out
      </Button>

      {JSON.stringify(credential)}

      <SwapWidget
        tokenList={LIST_TOKENS}
        userAddress={credential?.publicKey ?? null}
        userChainType={"webauthn"}
        sendNearTransaction={async () => {
          throw new Error("Not implemented")
        }}
        signMessage={async (msg) => {
          if (credential == null) {
            throw new Error("Unauthenticated")
          }

          const assertion = await navigator.credentials.get({
            publicKey: {
              challenge: msg.WEBAUTHN.challenge,
              allowCredentials: [
                { id: base58.decode(credential.rawId), type: "public-key" },
              ],
              timeout: 60000,
            },
          })

          // todo: this wasn't tested on mobile devices, need to check on iOS Safari and Android Chrome
          if (
            !(assertion instanceof PublicKeyCredential) ||
            !(assertion.response instanceof AuthenticatorAssertionResponse)
          ) {
            throw new Error("Invalid assertion")
          }

          return {
            type: "WEBAUTHN",
            signedData: msg.WEBAUTHN,
            signatureData: assertion.response,
          }
        }}
        onSuccessSwap={() => {}}
      />
    </div>
  )
}

async function parseWebAuthnPublicKey(
  publicKeyBuffer: ArrayBuffer,
  algorithm: COSEAlgorithmIdentifier
): Promise<Uint8Array> {
  switch (algorithm) {
    case -7: // ES256
      return parseECDSAKey(publicKeyBuffer, "P-256")
    case -8: // EdDSA (Ed25519)
      return parseEdDSAKey(publicKeyBuffer)
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`)
  }
}

async function parseECDSAKey(
  publicKey: ArrayBuffer,
  namedCurve: string
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "spki", // SubjectPublicKeyInfo format
    publicKey,
    {
      name: "ECDSA",
      namedCurve,
    },
    true, // extractable
    ["verify"]
  )

  const rawKey = await crypto.subtle.exportKey("raw", cryptoKey)
  const rawKeyArray = new Uint8Array(rawKey)

  if (rawKeyArray.length !== 65) {
    throw new Error(
      `Invalid public key size for ECDSA curve, it must be 65 bytes, but got ${rawKeyArray.length} bytes`
    )
  }

  // For EC P-256, the raw key is 65 bytes:
  // 1 byte prefix (0x04 for uncompressed point)
  // 32 bytes X coordinate
  // 32 bytes Y coordinate
  const x = rawKeyArray.slice(1, 33)
  const y = rawKeyArray.slice(33, 65)

  return new Uint8Array([...x, ...y])
}

/**
 * Ed25519 is not supported in most browsers, we can't use WebCrypto API to parse the key
 */
async function parseEdDSAKey(
  publicKeyBuffer: ArrayBuffer
): Promise<Uint8Array> {
  // For Ed25519, we need to:
  // 1. Parse the SPKI structure to get the raw key
  // 2. The raw key is already in the correct format (32 bytes)

  // Parse ASN.1 SPKI structure
  // Ed25519 SPKI structure is simpler than ECDSA
  // We can skip the first 12 bytes:
  // - 2 bytes: SEQUENCE tag and length
  // - 5 bytes: AlgorithmIdentifier SEQUENCE
  // - 5 bytes: BIT STRING tag and length
  const rawKeyArray = new Uint8Array(publicKeyBuffer).slice(12)

  // Ed25519 public key is already 32 bytes, no need for additional processing
  if (rawKeyArray.length !== 32) {
    throw new Error(`Invalid Ed25519 public key length: ${rawKeyArray.length}`)
  }

  return rawKeyArray
}

function formatPublicKey(
  rawPublicKey: Uint8Array,
  algorithm: COSEAlgorithmIdentifier
) {
  switch (algorithm) {
    case -7: {
      return `p256:${base58.encode(rawPublicKey)}`
    }

    case -8: {
      return `ed25519:${base58.encode(rawPublicKey)}`
    }

    default: {
      throw new Error(`Unsupported public key algorithm ${algorithm}`)
    }
  }
}
