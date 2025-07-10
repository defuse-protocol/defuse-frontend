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

vi.mock("@src/services/EventBus", () => ({
  default: {
    on: vi.fn(),
    emit: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}))

describe("useMixpanelBus", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("should register event listeners on mount", () => {
    renderHook(() => useMixpanelBus())
    // biome-ignore lint/style/noNonNullAssertion: bus is mocked
    expect(bus!.on).toHaveBeenCalledTimes(10)
  })

  it("should track events correctly", () => {
    renderHook(() => useMixpanelBus())

    const giftCreatedCallback = vi
      // biome-ignore lint/style/noNonNullAssertion: bus is mocked
      .mocked(bus!.on)
      .mock.calls.find((call) => call[0] === "gift_created")?.[1]

    expect(giftCreatedCallback).toBeDefined()

    // Emit event
    const testPayload = { userId: "123", amount: 100 }
    if (giftCreatedCallback) {
      giftCreatedCallback(testPayload)
    }

    // Should track exactly once
    expect(mockTrack).toHaveBeenCalledTimes(1)
    expect(mockTrack).toHaveBeenCalledWith("gift_created", testPayload)
  })

  it("should remove event listeners on unmount", () => {
    const { unmount } = renderHook(() => useMixpanelBus())

    // Verify listeners were registered
    // biome-ignore lint/style/noNonNullAssertion: bus is mocked
    expect(bus!.on).toHaveBeenCalledTimes(10)

    // Unmount the hook
    unmount()

    // Verify listeners were removed
    // biome-ignore lint/style/noNonNullAssertion: bus is mocked
    expect(bus!.removeListener).toHaveBeenCalledTimes(10)

    // Check that the correct events were removed
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

    for (const event of expectedEvents) {
      // biome-ignore lint/style/noNonNullAssertion: bus is mocked
      expect(bus!.removeListener).toHaveBeenCalledWith(
        event,
        expect.any(Function)
      )
    }
  })
})
