import { supabase } from "@src/libs/supabase"
import { logger } from "@src/utils/logger"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GET } from "./route"

vi.mock("@src/libs/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    })),
  },
}))

vi.mock("@src/utils/logger", () => ({
  logger: { error: vi.fn() },
}))

describe("GET /api/otc_trades/[rawId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return otc trade when found", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        encrypted_payload: "2Kc5WSg4kBsxQXBuBPjEH9",
        iv: "FAP3itbQYiwcEpKD",
      },
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect })

    const response = await GET(
      new Request(
        "http://localhost:3000/api/otc_trades/e00e4eb4-6d0f-446e-a93e-7632bf40ede9"
      ),
      {
        params: Promise.resolve({
          tradeId: "e00e4eb4-6d0f-446e-a93e-7632bf40ede9",
        }),
      }
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      encrypted_payload: "2Kc5WSg4kBsxQXBuBPjEH9",
      iv: "FAP3itbQYiwcEpKD",
    })
  })

  it("should return 404 when otc trade not found", async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect })

    const response = await GET(
      new Request(
        "http://localhost:3000/api/otc_trades/e00e4eb4-6d0f-446e-a93e-7632bf40ede9"
      ),
      {
        params: Promise.resolve({
          tradeId: "e00e4eb4-6d0f-446e-a93e-7632bf40ede9",
        }),
      }
    )

    expect(response.status).toBe(404)
  })

  it("should return 400 for invalid rawId", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/otc_trades/invalid"),
      {
        params: Promise.resolve({ tradeId: "invalid" }),
      }
    )

    expect(response.status).toBe(400)
  })

  it("should return 500 when database read fails", async () => {
    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error("dummy error") })
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect })

    const response = await GET(
      new Request(
        "http://localhost:3000/api/otc_trades/e00e4eb4-6d0f-446e-a93e-7632bf40ede9"
      ),
      {
        params: Promise.resolve({
          tradeId: "e00e4eb4-6d0f-446e-a93e-7632bf40ede9",
        }),
      }
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: "Failed to fetch otc trade",
    })
    expect(logger.error).toHaveBeenCalledOnce()
  })
})
