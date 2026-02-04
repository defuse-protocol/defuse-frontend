import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import type { ReadonlyURLSearchParams } from "next/navigation"
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest"
import { updateURLParamsWithdraw } from "./updateURLParams"

describe("updateURLParamsWithdraw", () => {
  let mockRouter: { replace: Mock }
  let mockSearchParams: URLSearchParams

  beforeEach(() => {
    mockRouter = { replace: vi.fn() }
    mockSearchParams = new URLSearchParams()
  })

  const asReadonly = (p: URLSearchParams): ReadonlyURLSearchParams =>
    p as unknown as ReadonlyURLSearchParams

  it("should set token and network", () => {
    updateURLParamsWithdraw({
      token: "USDC",
      network: "eth",
      contactId: undefined,
      recipient: undefined,
      router: mockRouter as unknown as AppRouterInstance,
      searchParams: asReadonly(mockSearchParams),
    })

    expect(mockRouter.replace).toHaveBeenCalledWith("?token=USDC&network=eth", {
      scroll: false,
    })
  })

  it("should remove token when null", () => {
    mockSearchParams.set("token", "USDC")
    mockSearchParams.set("network", "eth")

    updateURLParamsWithdraw({
      token: null,
      network: "eth",
      contactId: undefined,
      recipient: undefined,
      router: mockRouter as unknown as AppRouterInstance,
      searchParams: asReadonly(mockSearchParams),
    })

    expect(mockRouter.replace).toHaveBeenCalledWith("?network=eth", {
      scroll: false,
    })
  })

  it("should set contactId and remove recipient", () => {
    mockSearchParams.set("recipient", "0x123")

    updateURLParamsWithdraw({
      token: "USDC",
      network: "eth",
      contactId: "uuid-123",
      recipient: undefined,
      router: mockRouter as unknown as AppRouterInstance,
      searchParams: asReadonly(mockSearchParams),
    })

    expect(mockRouter.replace).toHaveBeenCalledWith(
      "?token=USDC&network=eth&contactId=uuid-123",
      { scroll: false }
    )
  })

  it("should remove contactId when null", () => {
    mockSearchParams.set("token", "USDC")
    mockSearchParams.set("contactId", "uuid-123")

    updateURLParamsWithdraw({
      token: "USDC",
      network: "eth",
      contactId: null,
      recipient: undefined,
      router: mockRouter as unknown as AppRouterInstance,
      searchParams: asReadonly(mockSearchParams),
    })

    expect(mockRouter.replace).toHaveBeenCalledWith("?token=USDC&network=eth", {
      scroll: false,
    })
  })

  it("should keep contactId when undefined", () => {
    mockSearchParams.set("token", "USDC")
    mockSearchParams.set("contactId", "uuid-123")

    updateURLParamsWithdraw({
      token: "USDT",
      network: "eth",
      contactId: undefined,
      recipient: undefined,
      router: mockRouter as unknown as AppRouterInstance,
      searchParams: asReadonly(mockSearchParams),
    })

    expect(mockRouter.replace).toHaveBeenCalled()
    const url = mockRouter.replace.mock.calls[0][0] as string
    const params = new URLSearchParams(url.replace("?", ""))
    expect(params.get("token")).toBe("USDT")
    expect(params.get("network")).toBe("eth")
    expect(params.get("contactId")).toBe("uuid-123")
  })

  it("should set recipient when no contactId exists", () => {
    updateURLParamsWithdraw({
      token: "USDC",
      network: "eth",
      contactId: undefined,
      recipient: "0x456",
      router: mockRouter as unknown as AppRouterInstance,
      searchParams: asReadonly(mockSearchParams),
    })

    expect(mockRouter.replace).toHaveBeenCalledWith(
      "?token=USDC&network=eth&recipient=0x456",
      { scroll: false }
    )
  })

  it("should not set recipient when contactId exists", () => {
    mockSearchParams.set("contactId", "uuid-123")

    updateURLParamsWithdraw({
      token: "USDC",
      network: "eth",
      contactId: undefined,
      recipient: "0x456",
      router: mockRouter as unknown as AppRouterInstance,
      searchParams: asReadonly(mockSearchParams),
    })

    expect(mockRouter.replace).toHaveBeenCalled()
    const url = mockRouter.replace.mock.calls[0][0] as string
    const params = new URLSearchParams(url.replace("?", ""))
    expect(params.get("contactId")).toBe("uuid-123")
    expect(params.has("recipient")).toBe(false)
  })

  it("should not call replace when params unchanged", () => {
    mockSearchParams.set("token", "USDC")
    mockSearchParams.set("network", "eth")

    updateURLParamsWithdraw({
      token: "USDC",
      network: "eth",
      contactId: undefined,
      recipient: undefined,
      router: mockRouter as unknown as AppRouterInstance,
      searchParams: asReadonly(mockSearchParams),
    })

    expect(mockRouter.replace).not.toHaveBeenCalled()
  })

  it("should remove contactId and add recipient in one call", () => {
    mockSearchParams.set("token", "USDC")
    mockSearchParams.set("contactId", "uuid-123")

    updateURLParamsWithdraw({
      token: "USDC",
      network: "eth",
      contactId: null,
      recipient: "0x456",
      router: mockRouter as unknown as AppRouterInstance,
      searchParams: asReadonly(mockSearchParams),
    })

    expect(mockRouter.replace).toHaveBeenCalledWith(
      "?token=USDC&network=eth&recipient=0x456",
      { scroll: false }
    )
  })
})
