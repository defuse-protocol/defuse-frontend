import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { type ActorRef, type Snapshot, createActor } from "xstate"
import productionTokens from "../../../../tokens/production.json"
import {
  DepositMode,
  type ParentEvents,
  depositFormReducer,
} from "./depositFormReducer"

const mockUSDCToken = productionTokens.tokens.find(
  (token) => token.unifiedAssetId === "usdc"
) as TokenInfo
const mockNEARToken = productionTokens.tokens.find(
  (token) => token.unifiedAssetId === "near"
) as TokenInfo

describe("depositFormReducer", () => {
  let actor: ReturnType<typeof createActor>
  beforeEach(() => {
    actor = createActor(depositFormReducer, {
      input: {
        parentRef: {
          send: vi.fn(),
        } as unknown as ActorRef<Snapshot<unknown>, ParentEvents>,
        token: mockUSDCToken,
      },
    })
    actor.start()
  })

  it("should update token to NEAR", () => {
    expect(actor.getSnapshot().context.token).toBe(mockUSDCToken)
    actor.send({
      type: "DEPOSIT_FORM.UPDATE_TOKEN",
      params: { token: mockNEARToken },
    })
    expect(actor.getSnapshot().context.token).toBe(mockNEARToken)
  })

  it("should be SIMPLE deposit mode on initial state", () => {
    expect(actor.getSnapshot().context.depositMode).toBe(DepositMode.SIMPLE)
  })

  it("should be ONE_CLICK deposit mode if is1cs is true", () => {
    actor.send({
      type: "DEPOSIT_FORM.UPDATE_BLOCKCHAIN",
      params: { network: "eth:8453", is1cs: true, tokensUsdPriceData: {} },
    })
    expect(actor.getSnapshot().context.token).toBe(mockUSDCToken)
    expect(actor.getSnapshot().context.depositMode).toBe(DepositMode.ONE_CLICK)
  })

  it("should be SIMPLE deposit mode if is1cs is true and same-token is swapped", () => {
    actor.send({
      type: "DEPOSIT_FORM.UPDATE_BLOCKCHAIN",
      params: { network: "eth:1", is1cs: true },
    })
    expect(actor.getSnapshot().context.depositMode).toBe(DepositMode.SIMPLE)
  })

  it("should be SIMPLE deposit mode if is1cs is false", () => {
    actor.send({
      type: "DEPOSIT_FORM.UPDATE_BLOCKCHAIN",
      params: { network: "eth:8453", is1cs: false },
    })
    expect(actor.getSnapshot().context.token).toBe(mockUSDCToken)
    expect(actor.getSnapshot().context.depositMode).toBe(DepositMode.SIMPLE)
  })

  it("should switch to ONE_CLICK deposit mode if swap token is different", () => {
    actor.send({
      type: "DEPOSIT_FORM.UPDATE_BLOCKCHAIN",
      params: { network: "eth:1", is1cs: true },
    })
    expect(actor.getSnapshot().context.depositMode).toBe(DepositMode.SIMPLE)

    actor.send({
      type: "DEPOSIT_FORM.UPDATE_BLOCKCHAIN",
      params: { network: "eth:8453", is1cs: true },
    })
    expect(actor.getSnapshot().context.depositMode).toBe(DepositMode.ONE_CLICK)
  })

  it("should reset network and amount if token is updated", () => {
    actor.send({
      type: "DEPOSIT_FORM.UPDATE_BLOCKCHAIN",
      params: { network: "eth:1", is1cs: true },
    })
    actor.send({
      type: "DEPOSIT_FORM.UPDATE_AMOUNT",
      params: { amount: "1" },
    })
    expect(actor.getSnapshot().context.token).toBe(mockUSDCToken)
    expect(actor.getSnapshot().context.blockchain).toBe("eth")
    expect(actor.getSnapshot().context.amount).toBe("1")

    actor.send({
      type: "DEPOSIT_FORM.UPDATE_TOKEN",
      params: { token: mockNEARToken },
    })
    expect(actor.getSnapshot().context.blockchain).toBe(null)
    expect(actor.getSnapshot().context.amount).toBe("")
    expect(actor.getSnapshot().context.parsedAmount).toBe(null)
  })
})
