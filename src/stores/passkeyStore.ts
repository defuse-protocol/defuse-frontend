import { base58 } from "@scure/base"
import {
  createWebauthnCredential,
  getWebauthnCredential,
} from "@src/api/webauthnCredentials"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type Credential = { publicKey: string; rawId: string }
type Status = "idle" | "signing-in" | "creating-new"

type State = {
  credential: Credential | undefined
  status: Status
}

type Actions = {
  setCredential: (passkey: Credential) => void
  clearCredential: () => void
  signIn: () => Promise<Credential>
  createNew: () => Promise<Credential>
  signMessage: (
    challenge: Uint8Array
  ) => Promise<AuthenticatorAssertionResponse>
}

type Store = State & Actions

export const useCurrentPasskey = create<Store>()(
  persist(
    (set, get) => ({
      credential: undefined,
      status: "idle" as Status,

      setCredential: (passkey: Credential) => {
        set({ credential: passkey })
      },

      clearCredential: () => set({ credential: undefined }),

      signIn: async () => {
        if (get().credential != null) {
          throw new Error("Already authenticated")
        }

        if (get().status !== "idle") {
          throw new Error("Authentication already in progress")
        }

        set({ status: "signing-in" })

        try {
          const assertion = await navigator.credentials.get({
            publicKey: {
              challenge: new Uint8Array(32),
              allowCredentials: [],
              timeout: 60000,
            },
          })

          if (!(assertion instanceof PublicKeyCredential)) {
            throw new Error("Invalid assertion type")
          }

          const rawId = base58.encode(new Uint8Array(assertion.rawId))
          const response = await getWebauthnCredential(rawId)
          const fetchedCredential = { rawId, publicKey: response.public_key }

          set({ credential: fetchedCredential })

          return fetchedCredential
        } finally {
          set({ status: "idle" })
        }
      },

      createNew: async () => {
        if (get().credential != null) {
          throw new Error("Already authenticated")
        }

        if (get().status !== "idle") {
          throw new Error("Authentication already in progress")
        }

        set({ status: "creating-new" })

        try {
          const formattedDate = new Date().toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })

          const attestation = await navigator.credentials.create({
            publicKey: {
              challenge: crypto.getRandomValues(new Uint8Array(32)),
              rp: {
                name: "Near Intents",
                id: window.location.hostname,
              },
              user: {
                id: crypto.getRandomValues(new Uint8Array(32)),
                name: `User ${formattedDate}`,
                displayName: `User ${formattedDate}`,
              },
              pubKeyCredParams: [
                { type: "public-key", alg: -8 },
                { type: "public-key", alg: -7 },
              ],
              authenticatorSelection: {
                requireResidentKey: true,
                residentKey: "required",
              },
              timeout: 60000,
              attestation: "direct",
            },
          })

          if (
            !(attestation instanceof PublicKeyCredential) ||
            !(attestation.response instanceof AuthenticatorAttestationResponse)
          ) {
            throw new Error("Invalid attestation type")
          }

          const pubKey = attestation.response.getPublicKey()
          if (pubKey == null) {
            throw new Error("Public key is null")
          }

          const algorithm = attestation.response.getPublicKeyAlgorithm()
          const rawPublicKey = await parseWebAuthnPublicKey(pubKey, algorithm)

          const newCredential = {
            rawId: base58.encode(new Uint8Array(attestation.rawId)),
            publicKey: formatPublicKey(rawPublicKey, algorithm),
          }

          await retryOperation(async () => {
            const response = await createWebauthnCredential({
              raw_id: newCredential.rawId,
              public_key: newCredential.publicKey,
              hostname: window.location.hostname,
            })
            if (!response.success) {
              throw new Error("Failed to save credential")
            }
          })

          set({ credential: newCredential })
          return newCredential
        } finally {
          set({ status: "idle" })
        }
      },

      signMessage: async (challenge: Uint8Array) => {
        const passkey = get().credential

        if (passkey == null) {
          throw new Error("Unauthenticated")
        }

        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [
              { id: base58.decode(passkey.rawId), type: "public-key" },
            ],
            timeout: 60000,
          },
        })

        if (
          !(assertion instanceof PublicKeyCredential) ||
          !(assertion.response instanceof AuthenticatorAssertionResponse)
        ) {
          throw new Error("Invalid assertion")
        }

        return assertion.response
      },
    }),
    {
      name: "app_wallets_passkey",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ credential: state.credential }),
    }
  )
)

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 10,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError ?? new Error("Operation failed after max retries")
}

async function parseWebAuthnPublicKey(
  publicKeyBuffer: ArrayBuffer,
  algorithm: number
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
    "spki",
    publicKey,
    {
      name: "ECDSA",
      namedCurve,
    },
    true,
    ["verify"]
  )
  const rawKey = await crypto.subtle.exportKey("raw", cryptoKey)
  const rawKeyArray = new Uint8Array(rawKey)
  if (rawKeyArray.length !== 65) {
    throw new Error(
      `Invalid public key size for ECDSA curve, it must be 65 bytes, but got ${rawKeyArray.length} bytes`
    )
  }
  const x = rawKeyArray.slice(1, 33)
  const y = rawKeyArray.slice(33, 65)
  return new Uint8Array([...x, ...y])
}

async function parseEdDSAKey(
  publicKeyBuffer: ArrayBuffer
): Promise<Uint8Array> {
  const rawKeyArray = new Uint8Array(publicKeyBuffer).slice(12)
  if (rawKeyArray.length !== 32) {
    throw new Error(`Invalid Ed25519 public key length: ${rawKeyArray.length}`)
  }
  return rawKeyArray
}

function formatPublicKey(rawPublicKey: Uint8Array, algorithm: number) {
  switch (algorithm) {
    case -7:
      return `p256:${base58.encode(rawPublicKey)}`
    case -8:
      return `ed25519:${base58.encode(rawPublicKey)}`
    default:
      throw new Error(`Unsupported public key algorithm ${algorithm}`)
  }
}
