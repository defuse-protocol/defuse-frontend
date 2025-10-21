import { waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { createActor, fromPromise } from "xstate"
import { depositGenerateAddressMachine } from "./depositGenerateAddressMachine"

describe("depositGenerateAddressMachine", () => {
  let actor: ReturnType<typeof createActor>
  const testUserAddress = "0x5ff8d1644ec46f23f1e3981831ed2ec3dd40c2ca"
  const testPoaGeneratedAddress = "0x87624021a714222411523b0456590b1434584730"
  const testPoaMemo = "memo-poa-bridge"
  const test1csGeneratedAddress = "0x1234567890abcdef1234567890abcdef12345678"
  const test1csMemo = "memo-1cs"

  beforeEach(() => {
    const machineWithMockedActor = depositGenerateAddressMachine.provide({
      actors: {
        generateDepositAddress: fromPromise(
          async (): Promise<{
            generateDepositAddress: string | null
            memo: string | null
          }> => {
            return {
              generateDepositAddress: testPoaGeneratedAddress,
              memo: testPoaMemo,
            }
          }
        ),
      },
    })

    actor = createActor(machineWithMockedActor)
    actor.start()
  })

  it("should start in idle state", () => {
    expect(actor.getSnapshot().matches("idle")).toBe(true)
  })

  it("should handle REQUEST_GENERATE_ADDRESS event SIMPLE mode", async () => {
    actor.send({
      type: "REQUEST_GENERATE_ADDRESS",
      params: {
        userAddress: testUserAddress,
        userChainType: "evm",
        blockchain: "eth",
        depositMode: "SIMPLE",
      },
    })
    expect(actor.getSnapshot().matches("generatingAddress")).toBe(true)

    await waitFor(() => {
      expect(actor.getSnapshot().matches("completed")).toBe(true)
    })

    expect(
      actor.getSnapshot().context.preparationOutput?.value
        .generateDepositAddress
    ).toBe(testPoaGeneratedAddress)
    expect(actor.getSnapshot().context.preparationOutput?.value.memo).toBe(
      testPoaMemo
    )
  })

  it("should handle REQUEST_GENERATE_ADDRESS event ONE_CLICK mode", async () => {
    actor.send({
      type: "REQUEST_GENERATE_ADDRESS",
      params: {
        userAddress: testUserAddress,
        userChainType: "evm",
        blockchain: "eth",
        depositMode: "ONE_CLICK",
      },
    })
    expect(actor.getSnapshot().matches("generatingAddress1cs")).toBe(true)

    actor.send({
      type: "REQUEST_1CS_GENERATE_ADDRESS",
      params: {
        tag: "ok",
        value: {
          generateDepositAddress: test1csGeneratedAddress,
          memo: test1csMemo,
        },
      },
    })

    await waitFor(() => {
      expect(actor.getSnapshot().matches("completed")).toBe(true)
    })

    expect(
      actor.getSnapshot().context.preparationOutput?.value
        .generateDepositAddress
    ).toBe(test1csGeneratedAddress)
    expect(actor.getSnapshot().context.preparationOutput?.value.memo).toBe(
      test1csMemo
    )
  })

  it("should handle REQUEST_GENERATE_ADDRESS event INVALID mode", async () => {
    actor.send({
      type: "REQUEST_GENERATE_ADDRESS",
      params: {
        userAddress: null,
        userChainType: null,
        blockchain: null,
      },
    })
    expect(actor.getSnapshot().matches("idle")).toBe(true)
  })

  it("should handle REQUEST_CLEAR_ADDRESS event", async () => {
    actor.send({
      type: "REQUEST_GENERATE_ADDRESS",
      params: {
        userAddress: testUserAddress,
        userChainType: "evm",
        blockchain: "eth",
        depositMode: "SIMPLE",
      },
    })

    await waitFor(() => {
      expect(actor.getSnapshot().matches("completed")).toBe(true)
    })
    expect(
      actor.getSnapshot().context.preparationOutput?.value
        .generateDepositAddress
    ).toBe(testPoaGeneratedAddress)

    actor.send({
      type: "REQUEST_CLEAR_ADDRESS",
    })
    expect(actor.getSnapshot().matches("idle")).toBe(true)
    expect(actor.getSnapshot().context.preparationOutput).toBeNull()
  })
})
