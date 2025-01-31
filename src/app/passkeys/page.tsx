"use client"

import { keccak_256 } from "@noble/hashes/sha3"
import { ECDSASigValue } from "@peculiar/asn1-ecc"
import { AsnParser } from "@peculiar/asn1-schema"
import { base58, base64, hex } from "@scure/base"
import { parseAuthenticatorData } from "@simplewebauthn/server/helpers"
import Button from "@src/components/Button/Button"
import cbor from "cbor"
import { useRef } from "react"
import { type Hex, hexToBytes, toHex } from "viem"

const msg = `{"signer_id":"$signerId","verifying_contract":"intents.near","deadline":{"timestamp":1732035219},"nonce":"XVoKfmScb3G+XqH9ke/fSlJ/3xO59sNhCxhpG821BH8=","intents":[{"intent":"token_diff","diff":{"nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near":"-1000","nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near":"998"}}]}`

export default function WebAuthnExamplePage() {
  const textRef = useRef<HTMLTextAreaElement>(null)

  const handleClickSignIn = async () => {
    try {
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
        {
          challenge: new Uint8Array(32),
          rp: { name: "Example" },
          user: {
            id: crypto.getRandomValues(new Uint8Array(32)),
            name: "foo",
            displayName: "",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -8 },
            { type: "public-key", alg: -7 },
            // { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: {},
          timeout: 60000,
          attestation: "direct",
        }

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })

      if (credential) {
        console.log("credential", (credential as PublicKeyCredential).toJSON())

        const userCreds: CreateCredential = {
          rawId: toHex(
            new Uint8Array((credential as PublicKeyCredential).rawId)
          ),
          pubKey: parsePublicKey(credential as PublicKeyCredential),
        }

        console.log("Public key saved to local storage", userCreds)
        localStorage.setItem("userCreds", JSON.stringify(userCreds))
      }
    } catch (error) {
      console.error("Error during sign-in:", error)
    }
  }

  const makeMessageToSign = (signerId: string) => {
    // @ts-ignore
    return textRef.current.value.replace("$signerId", signerId)
  }

  const toIntentsUser = async (pubKey: CreateCredential["pubKey"]) => {
    let address: string

    if (pubKey.startsWith("p256:")) {
      const pk = base58.decode(pubKey.slice(5))
      // todo: verify public size, must equal to 64 bytes

      const p256 = new TextEncoder().encode("p256")
      const addressBytes = keccak_256(new Uint8Array([...p256, ...pk])).slice(
        -20
      )

      // biome-ignore lint/style/useTemplate: <explanation>
      address = "0x" + hex.encode(addressBytes)
    } else if (pubKey.startsWith("ed25519:")) {
      const pk = base58.decode(pubKey.slice(8))
      // todo: verify public size, must equal to 32 bytes

      address = hex.encode(pk)
    } else {
      throw new Error("Unsupported public key type")
    }

    return address
  }

  const makeChallenge = async (message: string) => {
    const messageBytes = new TextEncoder().encode(message)
    const hash = await crypto.subtle.digest("SHA-256", messageBytes)
    return new Uint8Array(hash)
  }

  const formatSignature = (
    signature: ArrayBuffer,
    publicKey: CreateCredential["pubKey"]
  ) => {
    if (publicKey.startsWith("p256:")) {
      return `p256:${base58.encode(new Uint8Array(signature))}`
    }

    if (publicKey.startsWith("ed25519:")) {
      return `ed25519:${base58.encode(new Uint8Array(signature))}`
    }

    throw new Error("Unsupported public key type")
  }

  const formatPublicKey = (pubKey: CreateCredential["pubKey"]) => {
    return pubKey
  }

  const handleClickSignMessage = async () => {
    try {
      const storedCredential = localStorage.getItem("userCreds")
      if (!storedCredential) {
        throw new Error("No public key found in local storage")
      }

      const parsedCredential: CreateCredential = JSON.parse(storedCredential)
      console.log("parsedCredential", parsedCredential)
      const payload = makeMessageToSign(
        await toIntentsUser(parsedCredential.pubKey)
      )
      const challenge = await makeChallenge(payload)
      console.log("challenge", base58.encode(challenge))

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
        {
          challenge: challenge,
          allowCredentials: [
            {
              id: hexToBytes(parsedCredential.rawId),
              type: "public-key",
              // transports: ["internal"],
            },
          ],
          timeout: 60000,
        }

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })

      if (assertion) {
        console.log("Message signed:", assertion)

        console.log(
          JSON.stringify(
            {
              standard: "webauthn",
              payload,
              public_key: formatPublicKey(parsedCredential.pubKey),
              signature: formatSignature(
                parseSignature(
                  // @ts-expect-error
                  assertion.response.signature,
                  parsedCredential.pubKey
                ),
                parsedCredential.pubKey
              ),
              client_data_json: new TextDecoder("utf-8").decode(
                // @ts-expect-error
                assertion.response.clientDataJSON
              ),
              // url safe base64 unpadded
              authenticator_data: encodeURLSafeBase64(
                // @ts-expect-error
                new Uint8Array(assertion.response.authenticatorData)
              ),
            },
            null,
            2
          )
        )
      }
    } catch (error) {
      console.error("Error during message signing:", error)
    }
  }

  return (
    <div>
      <Button type={"button"} onClick={handleClickSignIn}>
        Sign In
      </Button>

      <Button type={"button"} onClick={handleClickSignMessage}>
        Sign Message
      </Button>

      <textarea
        ref={textRef}
        defaultValue={msg}
        style={{
          width: "100%",
          height: "300px",
        }}
      />
    </div>
  )
}

function decodeURLSafeBase64(id: string): Uint8Array {
  // Convert URL-safe base64 to regular base64
  const base64 = id.replace(/-/g, "+").replace(/_/g, "/")
  // Add padding if necessary
  const padding = base64.length % 4
  const paddedBase64 = padding ? base64 + "=".repeat(4 - padding) : base64
  // Convert to binary
  const paddedBinaryStr = atob(paddedBase64)
  const uint8Array = new Uint8Array(paddedBinaryStr.length)
  for (let i = 0; i < paddedBinaryStr.length; i++) {
    uint8Array[i] = paddedBinaryStr.charCodeAt(i)
  }
  return uint8Array
}

function encodeURLSafeBase64(uint8Array: Uint8Array): string {
  // Convert Uint8Array to binary string
  let binaryStr = ""
  for (let i = 0; i < uint8Array.length; i++) {
    binaryStr += String.fromCharCode(uint8Array[i])
  }
  // Convert binary string to regular base64
  const base64 = btoa(binaryStr)
  // Convert regular base64 to URL-safe base64
  const urlSafeBase64 = base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  return urlSafeBase64
}

// Parse the signature from the authenticator and remove the leading zero if necessary
function parseSignature(
  signature: Uint8Array,
  publicKey: CreateCredential["pubKey"]
): Uint8Array {
  if (publicKey.startsWith("ed25519:")) {
    // todo: verify signature size, must equal to 64 bytes
    return signature
  }

  if (!publicKey.startsWith("p256:")) {
    throw new Error("Unsupported public key type")
  }

  const parsedSignature = AsnParser.parse(signature, ECDSASigValue)
  let rBytes = new Uint8Array(parsedSignature.r)
  let sBytes = new Uint8Array(parsedSignature.s)
  if (shouldRemoveLeadingZero(rBytes)) {
    rBytes = rBytes.slice(1)
  }
  if (shouldRemoveLeadingZero(sBytes)) {
    sBytes = sBytes.slice(1)
  }
  const finalSignature = concatUint8Arrays([rBytes, sBytes])
  return finalSignature
  // return {
  //   r: toHex(finalSignature.slice(0, 32)),
  //   s: toHex(finalSignature.slice(32)),
  // }
}

function parsePublicKey(
  cred: PublicKeyCredential
): `p256:${string}` | `ed25519:${string}` {
  const decodedAttestationObj = cbor.decode(
    (cred.response as AuthenticatorAttestationResponse).attestationObject
  )
  const authData = parseAuthenticatorData(decodedAttestationObj.authData)
  const publicKey = cbor.decode(
    authData?.credentialPublicKey?.buffer as ArrayBuffer
  )

  switch (publicKey.get(3)) {
    case -7: {
      const keyBytes = new Uint8Array([
        ...publicKey.get(-2),
        ...publicKey.get(-3),
      ])
      return `p256:${base58.encode(keyBytes)}`
    }

    case -8: {
      const keyBytes = publicKey.get(-2)
      return `ed25519:${base58.encode(keyBytes)}`
    }

    default: {
      throw new Error("Unsupported public key type")
    }
  }
}

function shouldRemoveLeadingZero(bytes: Uint8Array): boolean {
  return bytes[0] === 0x0 && (bytes[1] & (1 << 7)) !== 0
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  let pointer = 0
  const totalLength = arrays.reduce((prev, curr) => prev + curr.length, 0)

  const toReturn = new Uint8Array(totalLength)

  for (const arr of arrays) {
    toReturn.set(arr, pointer)
    pointer += arr.length
  }

  return toReturn
}

type CreateCredential = {
  rawId: Hex
  pubKey: `p256:${string}` | `ed25519:${string}`
}

type P256Credential = {
  rawId: Hex
  clientData: {
    type: string
    challenge: string
    origin: string
    crossOrigin: boolean
  }
  authenticatorData: Hex
  signature: P256Signature
}

type P256Signature = {
  r: Hex
  s: Hex
}
