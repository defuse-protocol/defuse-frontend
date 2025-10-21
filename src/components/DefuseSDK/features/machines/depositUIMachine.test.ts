import { waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor, createMachine } from "xstate"
import productionTokens from "../../../../tokens/production.json"
import type { TokenInfo } from "../../types/base"

vi.mock("./depositUIMachine", async () => {
  const actual = await vi.importActual("./depositUIMachine")
  return {
    ...actual,
    // @ts-expect-error we can't type this properly
    depositUIMachine: actual.depositUIMachine.provide({
      actions: {
        // @ts-expect-error we can't type this properly
        ...actual.depositUIMachine.config.actions,
        refreshBalanceIfNeeded: vi.fn(() => []),
        sendToDepositGenerateAddressRef1csQuote: vi.fn(() => []),
      },
    }),
  }
})

vi.mock("../../services/depositService", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    prepareDeposit: vi.fn().mockResolvedValue({
      tag: "ok",
      value: {
        generateDepositAddress: "0xDd1943cf500F297Ac1B0b6958Fc2da819dA7b059",
        storageDepositRequired: 0n,
        balance: 1000000n,
        nearBalance: null,
        maxDepositValue: null,
        solanaATACreationRequired: false,
        tonJettonWalletCreationRequired: false,
        memo: null,
      },
    }),
  }
})

vi.mock("./1cs", () => ({
  getTokens: vi.fn(() => Promise.resolve([])),
}))

vi.mock("./background1csQuoterMachine", () => ({
  background1csQuoterMachine: createMachine({
    id: "background1csQuoterMachine",
    initial: "idle",
    states: {
      idle: {},
    },
  }),
}))

import { depositUIMachine } from "./depositUIMachine"

// Use real USDC token from production token list
const mockToken = productionTokens.tokens.find(
  (token) => token.unifiedAssetId === "usdc"
) as TokenInfo

describe("depositUIMachine on login/logout", () => {
  let actor: ReturnType<typeof createActor>

  beforeEach(() => {
    actor = createActor(depositUIMachine, {
      input: {
        tokenList: [],
        token: mockToken,
      },
    })
    actor.start()
  })

  it("should start in editing state", () => {
    expect(actor.getSnapshot().matches("editing")).toBe(true)
  })

  it("should handle LOGIN event", () => {
    actor.send({
      type: "LOGIN",
      params: {
        userAddress: "test.near",
        userWalletAddress: "test.near",
        userChainType: "near",
      },
    })

    expect(actor.getSnapshot().context.userAddress).toBe("test.near")
    expect(actor.getSnapshot().context.userWalletAddress).toBe("test.near")
    expect(actor.getSnapshot().context.userChainType).toBe("near")
  })

  it("should handle LOGOUT event", () => {
    actor.send({
      type: "LOGIN",
      params: {
        userAddress: "test.near",
        userWalletAddress: "test.near",
        userChainType: "near",
      },
    })

    expect(actor.getSnapshot().context.userAddress).toBe("test.near")

    actor.send({ type: "LOGOUT" })

    expect(actor.getSnapshot().context.userAddress).toBe("")
    expect(actor.getSnapshot().context.userWalletAddress).toBe("")
    expect(actor.getSnapshot().context.userChainType).toBe(null)
  })

  it("should pass through multiple LOGIN/LOGOUT cycles", () => {
    // First cycle
    actor.send({
      type: "LOGIN",
      params: {
        userAddress: "0x5ff8d1644ec46f23f1e3981831ed2ec3dd40c2ca",
        userWalletAddress: "0x5ff8d1644ec46f23f1e3981831ed2ec3dd40c2ca",
        userChainType: "evm",
      },
    })
    expect(actor.getSnapshot().context.userAddress).toBe(
      "0x5ff8d1644ec46f23f1e3981831ed2ec3dd40c2ca"
    )

    actor.send({ type: "LOGOUT" })
    expect(actor.getSnapshot().context.userAddress).toBe("")

    // Second cycle
    actor.send({
      type: "LOGIN",
      params: {
        userAddress: "near.near",
        userWalletAddress: "near.near",
        userChainType: "near",
      },
    })
    expect(actor.getSnapshot().context.userAddress).toBe("near.near")
    expect(actor.getSnapshot().context.userChainType).toBe("near")
  })
})

describe("depositUIMachine on editing", () => {
  let actor: ReturnType<typeof createActor>

  beforeEach(() => {
    actor = createActor(depositUIMachine, {
      input: {
        tokenList: [],
        token: mockToken,
      },
    })
    actor.start()

    actor.send({
      type: "LOGIN",
      params: {
        userAddress: "0x5ff8d1644ec46f23f1e3981831ed2ec3dd40c2ca",
        userWalletAddress: "0x5ff8d1644ec46f23f1e3981831ed2ec3dd40c2ca",
        userChainType: "evm",
      },
    })
  })

  it("should start in 'editing.idle' state", () => {
    const currentState = actor.getSnapshot()
    expect(currentState.matches("editing.idle")).toBe(true)
  })

  it("should reach editing.preparation and return to editing.idle state", async () => {
    const visited = new Set<string>()
    const sub = actor.subscribe((state) => {
      if (state.matches("editing.preparation")) {
        visited.add("editing.preparation")
      }
      if (state.matches("editing.idle")) {
        visited.add("editing.idle")
      }
    })

    setupFormFields(actor, mockToken)
    actor.send({
      type: "DEPOSIT_FORM_FIELDS_CHANGED",
      params: { fields: ["token", "blockchain", "amount"] },
    })

    expect(visited.has("editing.preparation")).toBe(true)

    await waitFor(() => {
      expect(actor.getSnapshot().matches("editing.idle")).toBe(true)
    })

    sub.unsubscribe()
  })

  it("should have editing.preparation result", async () => {
    expect(actor.getSnapshot().context.preparationOutput).toBeNull()

    setupFormFields(actor, mockToken)
    actor.send({
      type: "DEPOSIT_FORM_FIELDS_CHANGED",
      params: { fields: ["token", "blockchain", "amount"] },
    })

    await waitFor(() => {
      expect(actor.getSnapshot().matches("editing.idle")).toBe(true)
    })

    expect(actor.getSnapshot().context.preparationOutput).toBeDefined()
    expect(actor.getSnapshot().context.preparationOutput?.tag).toBe("ok")
    expect(
      actor.getSnapshot().context.preparationOutput?.value
        .generateDepositAddress
    ).toBe("0xDd1943cf500F297Ac1B0b6958Fc2da819dA7b059")
  })

  it("should reset preparationOutput once form fields are changed", async () => {
    setupFormFields(actor, mockToken)
    actor.send({
      type: "DEPOSIT_FORM_FIELDS_CHANGED",
      params: { fields: ["token", "blockchain", "amount"] },
    })

    await waitFor(() => {
      expect(actor.getSnapshot().matches("editing.idle")).toBe(true)
    })
    expect(actor.getSnapshot().context.preparationOutput?.tag).toBe("ok")

    setupFormFields(actor, mockToken)
    expect(actor.getSnapshot().context.preparationOutput).toBeNull()
  })
})

function setupFormFields(
  actor: ReturnType<typeof createActor>,
  token: TokenInfo
) {
  actor.send({
    type: "DEPOSIT_FORM.UPDATE_TOKEN",
    params: {
      token: token,
    },
  })
  actor.send({
    type: "DEPOSIT_FORM.UPDATE_BLOCKCHAIN",
    params: {
      network: "eth:8453",
      is1cs: false,
      tokensUsdPriceData: {},
    },
  })
  actor.send({
    type: "DEPOSIT_FORM.UPDATE_AMOUNT",
    params: {
      amount: "1",
    },
  })
}
