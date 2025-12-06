import { solverRelay } from "@defuse-protocol/internal-utils"
import {
  GetExecutionStatusResponse,
  type SubmitDepositTxResponse,
} from "@defuse-protocol/one-click-sdk-typescript"
import {
  getTxStatus,
  submitTxHash,
} from "@src/components/DefuseSDK/features/machines/1cs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { type ActorRef, type Snapshot, createActor } from "xstate"
import type { BaseTokenInfo, TokenInfo } from "../../types/base"
import type { WithdrawIntentDescription } from "./withdrawIntent1csMachine"
import { withdrawStatus1csMachine } from "./withdrawStatus1csMachine"

vi.mock("@src/components/DefuseSDK/features/machines/1cs", () => ({
  getTxStatus: vi.fn(),
  submitTxHash: vi.fn(),
}))

vi.mock("@defuse-protocol/internal-utils", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@defuse-protocol/internal-utils")>()
  return {
    ...actual,
    solverRelay: {
      waitForIntentSettlement: vi.fn(),
    },
  }
})

function mockSettlementResult(
  txHash: string
): solverRelay.WaitForIntentSettlementReturnType {
  return {
    txHash,
    intentHash: "intent-hash-123",
    status: "SETTLED",
  } as solverRelay.WaitForIntentSettlementReturnType
}

function mockStatusResponse(status: GetExecutionStatusResponse.status) {
  return {
    ok: {
      status,
      quoteResponse: {},
      updatedAt: new Date().toISOString(),
      swapDetails: {},
    } as GetExecutionStatusResponse,
  }
}

function mockSubmitTxResponse() {
  return { ok: {} as SubmitDepositTxResponse }
}

const mockTokenIn: BaseTokenInfo = {
  defuseAssetId: "nep141:usdc.near",
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  icon: "",
  originChainName: "near",
  deployments: [
    { address: "usdc.near", decimals: 6, chainName: "near", bridge: "direct" },
  ],
}

const mockTokenOut: BaseTokenInfo = {
  defuseAssetId: "eth:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  icon: "",
  originChainName: "eth",
  deployments: [
    {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
      chainName: "eth",
      bridge: "direct",
    },
  ],
}

function createMockIntentDescription(): WithdrawIntentDescription {
  return {
    type: "withdraw_1cs",
    totalAmountIn: { amount: 1000000n, decimals: 6 },
    totalAmountOut: { amount: 990000n, decimals: 6 },
    depositAddress: "deposit-address-123",
    recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
  }
}

type ChildEvent = {
  type: "WITHDRAW_1CS_SETTLED"
  data: {
    depositAddress: string
    status: GetExecutionStatusResponse.status
    tokenIn: TokenInfo
    tokenOut: TokenInfo
    recipient: string
  }
}
type ParentActor = ActorRef<Snapshot<unknown>, ChildEvent>

type MachineInput = {
  parentRef: ParentActor
  intentHash: string
  depositAddress: string
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  totalAmountIn: { amount: bigint; decimals: number }
  totalAmountOut: { amount: bigint; decimals: number }
  intentDescription: WithdrawIntentDescription
}

function createMockParentRef(
  sendFn: ReturnType<typeof vi.fn> = vi.fn()
): ParentActor {
  return { send: sendFn } as unknown as ParentActor
}

function createMockInput(parentSend?: ReturnType<typeof vi.fn>): MachineInput {
  return {
    parentRef: createMockParentRef(parentSend),
    intentHash: "intent-hash-123",
    depositAddress: "deposit-address-123",
    tokenIn: mockTokenIn,
    tokenOut: mockTokenOut,
    totalAmountIn: { amount: 1000000n, decimals: 6 },
    totalAmountOut: { amount: 990000n, decimals: 6 },
    intentDescription: createMockIntentDescription(),
  }
}

describe("withdrawStatus1csMachine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("happy path", () => {
    it("completes status polling successfully", async () => {
      vi.mocked(solverRelay.waitForIntentSettlement).mockImplementation(
        async ({ onTxHashKnown }) => {
          onTxHashKnown?.("tx-hash-456")
          return mockSettlementResult("tx-hash-456")
        }
      )

      vi.mocked(submitTxHash).mockResolvedValue(mockSubmitTxResponse())
      vi.mocked(getTxStatus).mockResolvedValue(
        mockStatusResponse(GetExecutionStatusResponse.status.SUCCESS)
      )

      const parentSend = vi.fn()
      const input = createMockInput(parentSend)

      const actor = createActor(withdrawStatus1csMachine, {
        input,
      })

      const completionPromise = new Promise<void>((resolve) => {
        actor.subscribe((state) => {
          if (state.status === "done") {
            resolve()
          }
        })
      })

      actor.start()
      await completionPromise

      expect(parentSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "WITHDRAW_1CS_SETTLED",
          data: expect.objectContaining({
            depositAddress: "deposit-address-123",
            status: "SUCCESS",
            recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
          }),
        })
      )
    })
  })

  describe("intent settlement", () => {
    it("waits for intent tx hash before submitting", async () => {
      let resolveSettlement: ((value: { txHash: string }) => void) | undefined
      const settlementPromise = new Promise<{ txHash: string }>((resolve) => {
        resolveSettlement = resolve
      })

      vi.mocked(solverRelay.waitForIntentSettlement).mockImplementation(
        async ({ onTxHashKnown }) => {
          const result = await settlementPromise
          onTxHashKnown?.(result.txHash)
          return mockSettlementResult(result.txHash)
        }
      )

      const actor = createActor(withdrawStatus1csMachine, {
        input: createMockInput(),
      })

      actor.start()

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe("intent_settling")
      })

      expect(submitTxHash).not.toHaveBeenCalled()

      vi.mocked(submitTxHash).mockResolvedValue(mockSubmitTxResponse())
      vi.mocked(getTxStatus).mockResolvedValue(
        mockStatusResponse(GetExecutionStatusResponse.status.SUCCESS)
      )

      resolveSettlement?.({ txHash: "tx-hash-789" })

      await vi.waitFor(() => {
        expect(submitTxHash).toHaveBeenCalledWith({
          depositAddress: "deposit-address-123",
          txHash: "tx-hash-789",
        })
      })

      actor.stop()
    })

    it("transitions to error when intent settlement fails", async () => {
      vi.mocked(solverRelay.waitForIntentSettlement).mockRejectedValue(
        new Error("Settlement timeout")
      )

      const actor = createActor(withdrawStatus1csMachine, {
        input: createMockInput(),
      })

      actor.start()

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe("error")
        expect(actor.getSnapshot().context.error?.message).toContain(
          "Settlement timeout"
        )
      })

      actor.stop()
    })
  })

  describe("status polling", () => {
    it("continues polling for trackable statuses", async () => {
      vi.mocked(solverRelay.waitForIntentSettlement).mockImplementation(
        async ({ onTxHashKnown }) => {
          onTxHashKnown?.("tx-hash-456")
          return mockSettlementResult("tx-hash-456")
        }
      )

      vi.mocked(submitTxHash).mockResolvedValue(mockSubmitTxResponse())

      let callCount = 0
      vi.mocked(getTxStatus).mockImplementation(async () => {
        callCount++
        if (callCount < 3) {
          return mockStatusResponse(
            GetExecutionStatusResponse.status.PROCESSING
          )
        }
        return mockStatusResponse(GetExecutionStatusResponse.status.SUCCESS)
      })

      const parentSend = vi.fn()
      const input = createMockInput(parentSend)

      const actor = createActor(withdrawStatus1csMachine, {
        input,
      })

      const completionPromise = new Promise<void>((resolve) => {
        actor.subscribe((state) => {
          if (state.status === "done") {
            resolve()
          }
        })
      })

      actor.start()
      await completionPromise

      expect(getTxStatus).toHaveBeenCalledTimes(3)
      expect(parentSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "WITHDRAW_1CS_SETTLED",
          data: expect.objectContaining({ status: "SUCCESS" }),
        })
      )
    })

    it("transitions to error when status check fails", async () => {
      vi.mocked(solverRelay.waitForIntentSettlement).mockImplementation(
        async ({ onTxHashKnown }) => {
          onTxHashKnown?.("tx-hash-456")
          return mockSettlementResult("tx-hash-456")
        }
      )

      vi.mocked(submitTxHash).mockResolvedValue(mockSubmitTxResponse())
      vi.mocked(getTxStatus).mockResolvedValue({ err: "Status check failed" })

      const actor = createActor(withdrawStatus1csMachine, {
        input: createMockInput(),
      })

      actor.start()

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe("error")
      })

      actor.stop()
    })
  })

  describe("retry mechanism", () => {
    it("retries from pending state on RETRY event", async () => {
      vi.mocked(solverRelay.waitForIntentSettlement).mockRejectedValueOnce(
        new Error("Network error")
      )

      const actor = createActor(withdrawStatus1csMachine, {
        input: createMockInput(),
      })

      actor.start()

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe("error")
      })

      vi.mocked(solverRelay.waitForIntentSettlement).mockImplementation(
        async ({ onTxHashKnown }) => {
          onTxHashKnown?.("tx-hash-456")
          return mockSettlementResult("tx-hash-456")
        }
      )
      vi.mocked(submitTxHash).mockResolvedValue(mockSubmitTxResponse())
      vi.mocked(getTxStatus).mockResolvedValue(
        mockStatusResponse(GetExecutionStatusResponse.status.SUCCESS)
      )

      actor.send({ type: "RETRY" })

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe("success")
      })

      actor.stop()
    })
  })
})
