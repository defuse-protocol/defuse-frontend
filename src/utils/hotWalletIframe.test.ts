import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createHotWalletCloseObserver, raceFirst } from "./hotWalletIframe"

const TRUSTED_ORIGIN = "https://my.herewallet.app"

/**
 * @note To be sure that createHotWalletCloseObserver isn't interfered flow of signMessageNear,
 * we have to test it.
 */
function mockRaceFirst<T>(operation: Promise<T>): Promise<T> {
  return raceFirst(operation, createHotWalletCloseObserver())
}

function createHotCloseEvent(): MessageEvent {
  return new MessageEvent("message", {
    data: "hot-close",
    origin: TRUSTED_ORIGIN,
  })
}

describe("hotWalletIframe", () => {
  let messageHandler: (event: MessageEvent) => void

  beforeEach(() => {
    vi.useFakeTimers()
    global.window = {
      addEventListener: vi.fn((_, handler) => {
        messageHandler = handler
      }),
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it("should resolve when promise completes before hot-close", async () => {
    const expectedResult = { success: true }
    const testPromise = Promise.resolve(expectedResult)

    const result = await mockRaceFirst(testPromise)
    expect(result).toEqual(expectedResult)
  })

  it("should reject when hot-close message is received", async () => {
    const testPromise = new Promise((resolve) => setTimeout(resolve, 1000))
    const racePromise = mockRaceFirst(testPromise)

    // Simulate hot-close button click from trusted origin
    messageHandler(createHotCloseEvent())

    await expect(racePromise).rejects.toThrow("User cancelled the operation")
  })

  it("should ignore other message events", async () => {
    const expectedResult = { success: true }
    const testPromise = Promise.resolve(expectedResult)
    const racePromise = mockRaceFirst(testPromise)

    // Simulate other random message
    messageHandler(new MessageEvent("message", { data: "some-other-message" }))

    const result = await racePromise
    expect(result).toEqual(expectedResult)
  })

  it("should cleanup event listener after completion", async () => {
    const testPromise = Promise.resolve()
    await mockRaceFirst(testPromise)

    // Simulate hot-close to trigger cleanup from trusted origin
    messageHandler(createHotCloseEvent())

    expect(global.window.removeEventListener).toHaveBeenCalledWith(
      "message",
      messageHandler
    )
  })

  it("should ignore hot-close from untrusted origin", async () => {
    const expectedResult = { success: true }
    const testPromise = Promise.resolve(expectedResult)
    const racePromise = mockRaceFirst(testPromise)

    // Simulate hot-close from untrusted origin
    messageHandler(
      new MessageEvent("message", {
        data: "hot-close",
        origin: "https://malicious-site.com",
      })
    )

    const result = await racePromise
    expect(result).toEqual(expectedResult)
  })
})
