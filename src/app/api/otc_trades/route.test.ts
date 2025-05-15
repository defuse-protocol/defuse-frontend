import { supabase } from "@src/libs/supabase"
import { TEST_BASE_URL } from "@src/tests/setup"
import { logger } from "@src/utils/logger"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

vi.mock("@src/libs/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(),
    })),
  },
}))

vi.mock("@src/utils/logger", () => ({
  logger: { error: vi.fn() },
}))

describe("POST /api/otc_trades", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should create otc trade successfully", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({
      error: null,
      data: { trade_id: "84b1d4b5-f9df-4d12-8706-72bd67bad634" },
    })
    const mockSelect = vi.fn().mockReturnValue({ single: () => mockUpsert() })
    vi.mocked(supabase.from).mockReturnValue({
      upsert: () => ({ select: mockSelect }),
    })

    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/otc_trades`, {
        method: "POST",
        body: JSON.stringify({
          encrypted_payload:
            "2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U",
          iv: "FAP3itbQYiwcEpKD",
        }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      trade_id: "84b1d4b5-f9df-4d12-8706-72bd67bad634",
    })
  })

  it("should return 400 for invalid data", async () => {
    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/otc_trades`, {
        method: "POST",
        body: JSON.stringify({
          encrypted_payload: "invalid aes256",
          iv: "invalid iv",
        }),
      })
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it("should return 500 when database insert fails", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({
      error: new Error("DB error"),
    })
    const mockSelect = vi.fn().mockReturnValue({ single: () => mockUpsert() })
    vi.mocked(supabase.from).mockReturnValue({
      upsert: () => ({ select: mockSelect }),
    })

    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/otc_trades`, {
        method: "POST",
        body: JSON.stringify({
          encrypted_payload:
            "2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U",
          iv: "FAP3itbQYiwcEpKD",
        }),
      })
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: "Failed to create otc trade",
    })
    expect(logger.error).toHaveBeenCalledOnce()
  })
})
