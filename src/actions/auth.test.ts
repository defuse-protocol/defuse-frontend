import type { MultiPayload } from "@defuse-protocol/contract-types"
import { extractSignerFromIntent } from "@src/utils/extractSignerFromIntent"
import { describe, expect, it } from "vitest"

// Helper to create a valid message JSON with signer_id
const createMessage = (signerId: string) =>
  JSON.stringify({
    signer_id: signerId,
    deadline: "2024-01-01T00:00:00.000Z",
    intents: [],
    nonce: "abc123",
    verifying_contract: "intents.near",
  })

describe("extractSignerFromIntent", () => {
  it("extracts signer_id from NEP-413 payload", () => {
    const signedIntent: MultiPayload = {
      standard: "nep413",
      payload: {
        message: JSON.stringify({
          signer_id: "user.near",
          deadline: "2024-01-01T00:00:00.000Z",
          intents: [],
        }),
        nonce: "YWJjMTIz", // base64 encoded
        recipient: "intents.near",
      },
      signature:
        "ed25519:3xqLbVXjPhYpYnKx4kqGqYpLYvLbWUjGpdVYQs9pKz9M1xqLbVXjPhYpYnKx4kqGqYpLYvLbWUjGpdVYQs9pKz9M",
      public_key: "ed25519:6E8sCci9badyRkXb3JoRpBj5p8C6Tw41ELDZoiihKEtp",
    }

    expect(extractSignerFromIntent(signedIntent)).toBe("user.near")
  })

  it("extracts signer_id from ERC-191 payload", () => {
    const signedIntent: MultiPayload = {
      standard: "erc191",
      payload: createMessage("evm:0x1234567890abcdef"),
      signature:
        "secp256k1:3xqLbVXjPhYpYnKx4kqGqYpLYvLbWUjGpdVYQs9pKz9M1xqLbVXjPhYpYnKx4kqGqYpLYvLbWUjGpdVYQs9pKz9M12",
    }

    expect(extractSignerFromIntent(signedIntent)).toBe("evm:0x1234567890abcdef")
  })

  it("extracts signer_id from TON_CONNECT text payload", () => {
    const signedIntent: MultiPayload = {
      standard: "ton_connect",
      address:
        "0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      domain: "example.com",
      timestamp: 1704067200,
      payload: {
        type: "text",
        text: createMessage("ton:abc123"),
      },
      public_key: "ed25519:6E8sCci9badyRkXb3JoRpBj5p8C6Tw41ELDZoiihKEtp",
      signature:
        "ed25519:3xqLbVXjPhYpYnKx4kqGqYpLYvLbWUjGpdVYQs9pKz9M1xqLbVXjPhYpYnKx4kqGqYpLYvLbWUjGpdVYQs9pKz9M",
    }

    expect(extractSignerFromIntent(signedIntent)).toBe("ton:abc123")
  })

  it("returns null for invalid payload structure", () => {
    const signedIntent = {
      standard: "erc191",
      payload: "not valid json",
      signature: "secp256k1:abc",
    } as MultiPayload

    expect(extractSignerFromIntent(signedIntent)).toBeNull()
  })

  it("returns null when signer_id is missing from message", () => {
    const signedIntent: MultiPayload = {
      standard: "erc191",
      payload: JSON.stringify({
        deadline: "2024-01-01T00:00:00.000Z",
        intents: [],
        nonce: "abc123",
        verifying_contract: "intents.near",
      }),
      signature:
        "secp256k1:3xqLbVXjPhYpYnKx4kqGqYpLYvLbWUjGpdVYQs9pKz9M1xqLbVXjPhYpYnKx4kqGqYpLYvLbWUjGpdVYQs9pKz9M12",
    }

    expect(extractSignerFromIntent(signedIntent)).toBeNull()
  })
})
