import { AuthMethod } from "@defuse-protocol/internal-utils"
import { describe, expect, it } from "vitest"
import { createActor, fromPromise } from "xstate"
import { depositGenerateAddressMachine } from "./depositGenerateAddressMachine"

const baseParams = {
  userAddress: "alice.near",
  userChainType: AuthMethod.Near,
  blockchain: "near" as const,
}

function makeActor() {
  return createActor(
    depositGenerateAddressMachine.provide({
      actors: {
        generateDepositAddress: fromPromise(
          async (): Promise<{
            generateDepositAddress: string | null
            memo: string | null
          }> => ({ generateDepositAddress: "addr-123", memo: null })
        ),
      },
    })
  )
}

describe("depositGenerateAddressMachine — BTC disabled", () => {
  it.each(["btc", "btc-legacy"])(
    'sets ERR_DISABLED for tokenFamilyAid "%s"',
    (tokenFamilyAid) => {
      const actor = makeActor()
      actor.start()

      actor.send({
        type: "REQUEST_GENERATE_ADDRESS",
        params: { ...baseParams, tokenFamilyAid },
      })

      const { preparationOutput } = actor.getSnapshot().context
      expect(preparationOutput).toEqual({
        tag: "err",
        value: { reason: "ERR_DISABLED" },
      })
    }
  )

  it("does not disable for non-BTC token families", () => {
    const actor = makeActor()
    actor.start()

    actor.send({
      type: "REQUEST_GENERATE_ADDRESS",
      params: { ...baseParams, tokenFamilyAid: "usdc" },
    })

    expect(actor.getSnapshot().matches("generating")).toBe(true)
  })

  it("does not disable when tokenFamilyAid is null", () => {
    const actor = makeActor()
    actor.start()

    actor.send({
      type: "REQUEST_GENERATE_ADDRESS",
      params: { ...baseParams, tokenFamilyAid: null },
    })

    expect(actor.getSnapshot().matches("generating")).toBe(true)
  })
})
