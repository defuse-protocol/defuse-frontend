import { AuthMethod } from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { describe, expect, it, vi } from "vitest"
import { createActor, fromPromise, waitFor } from "xstate"
import type { BaseTokenInfo, TokenDeployment } from "../../types/base"
import { withdraw1csMachine } from "./withdraw1csMachine"

// 1cs.ts runs top-level env-var validation on import; mock it so the module loads in tests.
// The actors are fully overridden via machine.provide(), so these are never called.
vi.mock("@src/components/DefuseSDK/features/machines/1cs", () => ({
  getWithdrawQuote: vi.fn(),
  generateIntent: vi.fn(),
  submitIntent: vi.fn(),
}))

const DEPOSIT_ADDRESS = "deposit.1cs.near"
const INTENT_HASH = "intent-hash-abc123"
const AMOUNT_IN = 1_000_000n
const AMOUNT_OUT = 990_000n

const MOCK_WALLET_MSG = {
  ERC191: { message: "test" },
} as walletMessage.WalletMessage

const MOCK_SIG: walletMessage.WalletSignatureResult = {
  type: "ERC191",
  signatureData: "0xabc",
  signedData: { message: "test" },
}

const TOKEN_IN: BaseTokenInfo = {
  defuseAssetId: "nep141:usdc.near",
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  icon: "",
  originChainName: "near",
  deployments: [
    { address: "usdc.near", decimals: 6, chainName: "near", bridge: "poa" },
  ],
}

const TOKEN_OUT: BaseTokenInfo = {
  defuseAssetId: "nep141:usdt.near",
  symbol: "USDT",
  name: "Tether",
  decimals: 6,
  icon: "",
  originChainName: "eth",
  deployments: [
    { address: "0xusdt", decimals: 6, chainName: "eth", bridge: "poa" },
  ],
}

const TOKEN_OUT_DEPLOYMENT: TokenDeployment = {
  address: "0xusdt",
  decimals: 6,
  chainName: "eth",
  bridge: "poa",
}

function makeInput(overrides: Record<string, unknown> = {}) {
  return {
    tokenIn: TOKEN_IN,
    tokenOut: TOKEN_OUT,
    tokenOutDeployment: TOKEN_OUT_DEPLOYMENT,
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageBasisPoints: 50,
    defuseUserId: "user.near",
    deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    userAddress: "0xUserAddress",
    userChainType: AuthMethod.EVM,
    nearClient: null,
    amountIn: { amount: AMOUNT_IN, decimals: 6 },
    recipient: "0xRecipient",
    recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    previousOppositeAmount: { amount: AMOUNT_OUT, decimals: 6 },
    ...overrides,
  }
}

function withActors(overrides: Record<string, unknown>) {
  // biome-ignore lint/suspicious/noExplicitAny: actor overrides in tests don't need to satisfy full SDK output types
  return { ...happyActors, ...overrides } as any
}

// biome-ignore lint/suspicious/noExplicitAny: actor overrides in tests don't need to satisfy full SDK output types
const happyActors: any = {
  fetch1csQuoteActor: fromPromise(async () => ({
    ok: {
      quote: {
        amountIn: AMOUNT_IN.toString(),
        amountOut: AMOUNT_OUT.toString(),
        depositAddress: DEPOSIT_ADDRESS,
      },
      appFee: [] as [string, bigint][],
    },
  })),
  generateIntentActor: fromPromise(async () => MOCK_WALLET_MSG),
  signMessage: fromPromise(async () => MOCK_SIG),
  submitIntentActor: fromPromise(async () => ({
    tag: "ok" as const,
    value: INTENT_HASH,
  })),
}

describe("withdraw1csMachine", () => {
  it("completes with ok output after the full happy path flow", async () => {
    const actor = createActor(
      withdraw1csMachine.provide({ actors: happyActors }),
      {
        input: makeInput(),
      }
    )
    actor.start()

    await waitFor(actor, (s) => s.matches("AwaitingUserConfirmation"))
    actor.send({ type: "CONFIRMED" })
    const done = await waitFor(actor, (s) => s.status === "done")

    expect(done.output).toEqual(
      expect.objectContaining({
        tag: "ok",
        value: expect.objectContaining({
          intentHash: INTENT_HASH,
          depositAddress: DEPOSIT_ADDRESS,
          intentDescription: expect.objectContaining({
            type: "withdraw",
            recipient: "0xRecipient",
            totalAmountIn: { amount: AMOUNT_IN, decimals: 6 },
            totalAmountOut: { amount: AMOUNT_OUT, decimals: 6 },
          }),
        }),
      })
    )
  })

  it("sends EXECUTION_QUOTE_READY to parentRef when the quote is ready", async () => {
    const parentSend = vi.fn()
    const actor = createActor(
      withdraw1csMachine.provide({ actors: happyActors }),
      {
        input: makeInput({ parentRef: { send: parentSend } }),
      }
    )
    actor.start()

    await waitFor(actor, (s) => s.matches("AwaitingUserConfirmation"))

    expect(parentSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "EXECUTION_QUOTE_READY",
        params: expect.objectContaining({
          newAmountIn: { amount: AMOUNT_IN, decimals: 6 },
          newOppositeAmount: { amount: AMOUNT_OUT, decimals: 6 },
        }),
      })
    )
  })

  it("produces ERR_USER_DIDNT_SIGN error output when user cancels", async () => {
    const actor = createActor(
      withdraw1csMachine.provide({ actors: happyActors }),
      {
        input: makeInput(),
      }
    )
    actor.start()

    await waitFor(actor, (s) => s.matches("AwaitingUserConfirmation"))
    actor.send({ type: "CANCELLED" })
    const done = await waitFor(actor, (s) => s.status === "done")

    expect(done.output).toEqual(
      expect.objectContaining({
        tag: "err",
        value: expect.objectContaining({ reason: "ERR_USER_DIDNT_SIGN" }),
      })
    )
  })

  it("produces ERR_1CS_QUOTE_FAILED when quote fetch throws", async () => {
    const actors = withActors({
      fetch1csQuoteActor: fromPromise(async () => {
        throw new Error("network error")
      }),
    })
    const actor = createActor(withdraw1csMachine.provide({ actors }), {
      input: makeInput(),
    })
    actor.start()
    const done = await waitFor(actor, (s) => s.status === "done")

    expect(done.output).toEqual(
      expect.objectContaining({
        tag: "err",
        value: expect.objectContaining({ reason: "ERR_1CS_QUOTE_FAILED" }),
      })
    )
  })

  it("produces ERR_NO_DEPOSIT_ADDRESS when quote has no deposit address", async () => {
    const actors = withActors({
      fetch1csQuoteActor: fromPromise(async () => ({
        ok: {
          quote: {
            amountIn: AMOUNT_IN.toString(),
            amountOut: AMOUNT_OUT.toString(),
          },
          appFee: [] as [string, bigint][],
        },
      })),
    })
    const actor = createActor(withdraw1csMachine.provide({ actors }), {
      input: makeInput(),
    })
    actor.start()
    const done = await waitFor(actor, (s) => s.status === "done")

    expect(done.output).toEqual(
      expect.objectContaining({
        tag: "err",
        value: expect.objectContaining({ reason: "ERR_NO_DEPOSIT_ADDRESS" }),
      })
    )
  })

  it("produces ERR_GENERATE_INTENT_FAILED when intent generation throws", async () => {
    const actors = withActors({
      generateIntentActor: fromPromise(async () => {
        throw new Error("generate failed")
      }),
    })
    const actor = createActor(withdraw1csMachine.provide({ actors }), {
      input: makeInput(),
    })
    actor.start()

    await waitFor(actor, (s) => s.matches("AwaitingUserConfirmation"))
    actor.send({ type: "CONFIRMED" })
    const done = await waitFor(actor, (s) => s.status === "done")

    expect(done.output).toEqual(
      expect.objectContaining({
        tag: "err",
        value: expect.objectContaining({
          reason: "ERR_GENERATE_INTENT_FAILED",
        }),
      })
    )
  })

  it("produces ERR_USER_DIDNT_SIGN when signMessage returns null", async () => {
    const actors = withActors({
      signMessage: fromPromise(async () => null),
    })
    const actor = createActor(withdraw1csMachine.provide({ actors }), {
      input: makeInput(),
    })
    actor.start()

    await waitFor(actor, (s) => s.matches("AwaitingUserConfirmation"))
    actor.send({ type: "CONFIRMED" })
    const done = await waitFor(actor, (s) => s.status === "done")

    expect(done.output).toEqual(
      expect.objectContaining({
        tag: "err",
        value: expect.objectContaining({ reason: "ERR_USER_DIDNT_SIGN" }),
      })
    )
  })

  it("proceeds to AwaitingUserConfirmation when quote is valid but worse than previous", async () => {
    const actors = withActors({
      fetch1csQuoteActor: fromPromise(async () => ({
        ok: {
          quote: {
            amountIn: AMOUNT_IN.toString(),
            amountOut: "980000", // less than previousOppositeAmount (990_000n) → worse
            depositAddress: DEPOSIT_ADDRESS,
          },
          appFee: [] as [string, bigint][],
        },
      })),
    })
    const actor = createActor(withdraw1csMachine.provide({ actors }), {
      input: makeInput(),
    })
    actor.start()

    await waitFor(actor, (s) => s.matches("AwaitingUserConfirmation"))
    // reaching this state confirms the machine didn't error out on a worse quote
  })

  it("extracts wallet-specific error code when signMessage throws a known wallet error", async () => {
    const walletError = Object.assign(new Error("User cancelled the action"), {
      name: "MeteorActionError",
    })
    const actors = withActors({
      signMessage: fromPromise(async () => {
        throw walletError
      }),
    })
    const actor = createActor(withdraw1csMachine.provide({ actors }), {
      input: makeInput(),
    })
    actor.start()

    await waitFor(actor, (s) => s.matches("AwaitingUserConfirmation"))
    actor.send({ type: "CONFIRMED" })
    const done = await waitFor(actor, (s) => s.status === "done")

    expect(done.output).toEqual(
      expect.objectContaining({
        tag: "err",
        value: expect.objectContaining({ reason: "ERR_WALLET_CANCEL_ACTION" }),
      })
    )
  })

  it("produces ERR_CANNOT_PUBLISH_INTENT when intent submission is rejected by server", async () => {
    const actors = withActors({
      submitIntentActor: fromPromise(async () => ({
        tag: "err" as const,
        value: { reason: "insufficient_balance" },
      })),
    })
    const actor = createActor(withdraw1csMachine.provide({ actors }), {
      input: makeInput(),
    })
    actor.start()

    await waitFor(actor, (s) => s.matches("AwaitingUserConfirmation"))
    actor.send({ type: "CONFIRMED" })
    const done = await waitFor(actor, (s) => s.status === "done")

    expect(done.output).toEqual(
      expect.objectContaining({
        tag: "err",
        value: expect.objectContaining({ reason: "ERR_CANNOT_PUBLISH_INTENT" }),
      })
    )
  })
})
