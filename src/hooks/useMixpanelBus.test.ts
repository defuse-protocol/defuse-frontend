import bus from "@src/services/EventBus"
import { cleanup } from "@testing-library/react"
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { afterEach } from "vitest"
import { useMixpanelBus } from "./useMixpanelBus"

const mockTrack = vi.fn()
const mockMixpanel = {
  track: mockTrack,
  init: vi.fn(),
}

vi.mock("mixpanel-browser", () => ({
  default: mockMixpanel,
}))

vi.mock("@src/providers/MixpanelProvider", () => ({
  useMixpanel: () => mockMixpanel,
}))

// Track actual callbacks for proper verification
const registeredCallbacks = new Map<
  string,
  (payload: Record<string, unknown>) => void
>()

vi.mock("@src/services/EventBus", () => {
  const mockBus = {
    on: vi.fn(
      (event: string, callback: (payload: Record<string, unknown>) => void) => {
        registeredCallbacks.set(event, callback)
      }
    ),
    emit: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
  }

  return {
    default: mockBus,
  }
})

describe("useMixpanelBus", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registeredCallbacks.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it("should register event listeners for all expected events on mount", () => {
    renderHook(() => useMixpanelBus())

    const expectedEvents = [
      "gift_created",
      "deposit_initiated",
      "deposit_success",
      "gift_claimed",
      "otc_deal_initiated",
      "swap_initiated",
      "swap_confirmed",
      "otc_confirmed",
      "withdrawal_initiated",
      "withdrawal_confirmed",
    ]

    // biome-ignore lint/style/noNonNullAssertion: bus is mocked
    expect(vi.mocked(bus!.on)).toHaveBeenCalledTimes(expectedEvents.length)

    for (const event of expectedEvents) {
      // biome-ignore lint/style/noNonNullAssertion: bus is mocked
      expect(vi.mocked(bus!.on)).toHaveBeenCalledWith(
        event,
        expect.any(Function)
      )
      expect(registeredCallbacks.has(event)).toBe(true)
    }
  })

  it("should track events correctly for all registered events", () => {
    renderHook(() => useMixpanelBus())

    for (const [event, callback] of registeredCallbacks.entries()) {
      const testPayload = { userId: "123" }

      mockTrack.mockClear()

      callback(testPayload)

      expect(mockTrack).toHaveBeenCalledTimes(1)
      expect(mockTrack).toHaveBeenCalledWith(event, testPayload)
    }
  })

  it("should remove the exact same callbacks on unmount", () => {
    const { unmount } = renderHook(() => useMixpanelBus())

    // biome-ignore lint/style/noNonNullAssertion: bus is mocked
    expect(vi.mocked(bus!.on)).toHaveBeenCalledTimes(10)

    unmount()

    // biome-ignore lint/style/noNonNullAssertion: bus is mocked
    expect(vi.mocked(bus!.removeListener)).toHaveBeenCalledTimes(10)

    for (const [event, callback] of registeredCallbacks.entries()) {
      // biome-ignore lint/style/noNonNullAssertion: bus is mocked
      expect(vi.mocked(bus!.removeListener)).toHaveBeenCalledWith(
        event,
        callback
      )
    }
  })

  it("should handle multiple event emissions correctly", () => {
    renderHook(() => useMixpanelBus())

    const giftCreatedCallback = registeredCallbacks.get("gift_created")
    expect(giftCreatedCallback).toBeDefined()

    if (giftCreatedCallback) {
      // Emit multiple events
      const payload1 = { userId: "123" }
      const payload2 = { userId: "456" }

      giftCreatedCallback(payload1)
      giftCreatedCallback(payload2)

      // Should track both events
      expect(mockTrack).toHaveBeenCalledTimes(2)
      expect(mockTrack).toHaveBeenNthCalledWith(1, "gift_created", payload1)
      expect(mockTrack).toHaveBeenNthCalledWith(2, "gift_created", payload2)
    }
  })
})
