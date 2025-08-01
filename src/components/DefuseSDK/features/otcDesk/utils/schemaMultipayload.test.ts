import {
  prepareBroadcastRequest,
  type walletMessage,
} from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"
import { Keypair } from "@solana/web3.js"
import nacl from "tweetnacl"
import * as v from "valibot"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { describe, expect, it } from "vitest"
import {
  type SignerCredentials,
  formatSignedIntent,
} from "../../../core/formatters"
import {
  createEmptyIntentMessage,
  createSwapIntentMessage,
  createWithdrawIntentMessage,
} from "../../../core/messages"
import type { MultiPayload } from "../../../types/defuse-contracts-types"
import {
  GeneralPayloadObjectSchema,
  MultiPayloadDeepSchema,
} from "./schemaMultipayload"

describe("mulltipayload schemas", async () => {
  it.each([
    // swap
    await signERC191(genSwapIntent),
    await signRawED25519(genSwapIntent),
    // withdraw
    await signERC191(genWithdrawIntent),
    await signRawED25519(genWithdrawIntent),
    // native withdraw
    await signERC191(genNativeWithdrawIntent),
    await signRawED25519(genNativeWithdrawIntent),
    // no intents
    await signERC191(genEmptyIntent),
    await signRawED25519(genEmptyIntent),
    // WebAuthn-P256 (empty intent)
    JSON.parse(
      '{"standard":"webauthn","public_key":"p256:QXi4C3LumN7Nk3Xh9fkwaiQWzMtK9Aeq1ZmHVx6dvgVK4ybEsYNsWgqDP3mXn3DABctvW4AWrfiHHsZfuLFejaK","authenticator_data":"e_38lYTpqGj6nGFLqMy9rPqabbuZNCeaNA7P6uNCpKwdAAAAAA","client_data_json":"{\\"type\\":\\"webauthn.get\\",\\"challenge\\":\\"UIJDmOpoatVOk9R3Wknw7Wkudm6yL0wclFUizAS7tZ8\\",\\"origin\\":\\"https://app.near-intents.org\\"}","payload":"{\\"signer_id\\":\\"0x2af28c6d39befc4486b94d247771b12370584718\\",\\"verifying_contract\\":\\"intents.near\\",\\"deadline\\":\\"2025-03-10T18:49:46.700Z\\",\\"nonce\\":\\"i5O1Z9ZyMz0HBJeLaracQfJOhame11//Mxgg+g9gbd0=\\",\\"intents\\":[]}","signature":"p256:4eMvwkk4YyfFXqs5g6TeaxfBjGCUkmqrsEyu47niHa2nsMwi9VDWTFA849KQCYAh8WC2DYbVyKNyMH7afvVxHFkp"}'
    ),
    // WebAuth-Ed25519 (token_diff)
    JSON.parse(
      '{"standard":"webauthn","payload":"{\\"signer_id\\":\\"a91854052c1a404575c5fdf762bbaa6f69c2061182b0d1ca05add2b40ff48120\\",\\"verifying_contract\\":\\"intents.near\\",\\"deadline\\":\\"2025-03-11T21:26:43.506Z\\",\\"nonce\\":\\"mAtdDYjs1p58/zWwaWqk91VduXWO7ds2FbkMlBT97hc=\\",\\"intents\\":[{\\"intent\\":\\"token_diff\\",\\"diff\\":{\\"nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near\\":\\"-1000000\\",\\"nep141:wrap.near\\":\\"1000000000000000000000000\\"},\\"referral\\":\\"near-intents.intents-referral.near\\",\\"memo\\":\\"OTC_CREATE\\"}]}","public_key":"ed25519:CP5RBUrhgnrGdzGb1edscihGuP9gFuUcKjH22gKYYzbZ","signature":"ed25519:3QpBR9SFxvRhzKt8xzt7dvPCtBtdFhfQbx7uuXMv2dVPjXJUv3GyU94Rzz5FxMvou41orVNkkbVd8P4cYKFgqLH8","client_data_json":"{\\"type\\":\\"webauthn.get\\",\\"challenge\\":\\"vIDcfLTZBT3GYlGT6yK0dPt_xzp_ZQlo9aFt8jzAfGM\\",\\"origin\\":\\"http://localhost:3000\\"}","authenticator_data":"SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFZ50EBQ"}'
    ),
  ])("should parse multipayload", (multipayload) => {
    expect(() => v.parse(MultiPayloadDeepSchema, multipayload)).not.toThrow()
  })
})

describe("PayloadObjectSchema", () => {
  const signer1: SignerCredentials = {
    credential: "user.near",
    credentialType: "near",
  }

  it.each([
    ["incorrect nonce", "Invalid base64 encoding"],
    [
      base64.encode(crypto.getRandomValues(new Uint8Array(64))),
      "Invalid length (32 bytes expected, got 64)",
    ],
  ])("incorrect nonce", async (invalidNonce, err) => {
    const walletMessage = genSwapIntent(signer1)
    const payloadObj = JSON.parse(walletMessage.ERC191.message)

    expect(() =>
      v.parse(GeneralPayloadObjectSchema, {
        ...payloadObj,
        nonce: invalidNonce,
      })
    ).toThrow(err)
  })

  it("incorrect signer_id", async () => {
    const walletMessage = genSwapIntent(signer1)
    const payloadObj = JSON.parse(walletMessage.ERC191.message)

    expect(() =>
      v.parse(GeneralPayloadObjectSchema, {
        ...payloadObj,
        signer_id: "invalid-signer-",
      })
    ).toThrow('Invalid input: Received "invalid-signer-"')
  })

  it("incorrect verifying_contract", () => {
    const walletMessage = genSwapIntent(signer1)
    const payloadObj = JSON.parse(walletMessage.ERC191.message)

    expect(() =>
      v.parse(GeneralPayloadObjectSchema, {
        ...payloadObj,
        verifying_contract: "invalid-contract-name-",
      })
    ).toThrow('Invalid input: Received "invalid-contract-name-"')
  })
})

function genSwapIntent(signerId: SignerCredentials) {
  return createSwapIntentMessage([["nep141:token1", 3n]], { signerId })
}

function genEmptyIntent(signerId: SignerCredentials) {
  return createEmptyIntentMessage({ signerId })
}

function genNativeWithdrawIntent(signerId: SignerCredentials) {
  return createWithdrawIntentMessage(
    {
      type: "to_near",
      amount: 100n,
      tokenAccountId: "wrap.near",
      receiverId: "user.near",
      storageDeposit: 0n,
    },
    { signerId }
  )
}

function genWithdrawIntent(signerId: SignerCredentials) {
  return createWithdrawIntentMessage(
    {
      type: "to_near",
      amount: 100n,
      tokenAccountId: "usdc.near",
      receiverId: "user.near",
      storageDeposit: 150000000000n,
    },
    { signerId }
  )
}

type FakeSign = (
  walletMessageFactory: (
    signerCreds: SignerCredentials
  ) => walletMessage.WalletMessage
) => Promise<MultiPayload>

const signERC191: FakeSign = async (walletMessageFactory) => {
  const signer = privateKeyToAccount(generatePrivateKey())
  const signerCreds: SignerCredentials = {
    credential: signer.address,
    credentialType: "evm",
  }

  const walletMessage = walletMessageFactory(signerCreds)

  return formatSignedIntent(
    {
      type: "ERC191",
      signatureData: prepareBroadcastRequest.normalizeERC191Signature(
        await signer.signMessage(walletMessage.ERC191)
      ),
      signedData: walletMessage.ERC191,
    },
    signerCreds
  )
}

const signRawED25519: FakeSign = async (walletMessageFactory) => {
  const keypair = Keypair.generate()
  const signerCreds: SignerCredentials = {
    credential: keypair.publicKey.toBase58(),
    credentialType: "solana",
  }

  const walletMessage = walletMessageFactory(signerCreds)

  const signature = nacl.sign.detached(
    walletMessage.SOLANA.message,
    keypair.secretKey
  )

  return formatSignedIntent(
    {
      type: "SOLANA",
      signatureData: signature,
      signedData: walletMessage.SOLANA,
    },
    signerCreds
  )
}
