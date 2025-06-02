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

describe("GET /api/gifts/[giftId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return gift when found", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        encrypted_payload: "2Kc5WSg4kBsxQXBuBPjEH9",
        p_key: "oNn2ERFTt5qfeqHeY8zKsO5CxfECNl8AhWvdRdD38sw",
      },
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect })

    const response = await GET(
      new Request(
        "http://localhost:3000/api/gifts/123e4567-e89b-5123-a456-426614174000"
      ),
      {
        params: Promise.resolve({
          giftId: "123e4567-e89b-5123-a456-426614174000",
        }),
      }
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      encrypted_payload: "2Kc5WSg4kBsxQXBuBPjEH9",
      p_key: "oNn2ERFTt5qfeqHeY8zKsO5CxfECNl8AhWvdRdD38sw",
    })
  })

  it("should return 404 when gift not found", async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect })

    const response = await GET(
      new Request(
        "http://localhost:3000/api/gifts/123e4567-e89b-5123-a456-426614174000"
      ),
      {
        params: Promise.resolve({
          giftId: "123e4567-e89b-5123-a456-426614174000",
        }),
      }
    )

    expect(response.status).toBe(404)
  })

  it("should return 400 for invalid giftId", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/gifts/invalid"),
      {
        params: Promise.resolve({ giftId: "invalid" }),
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
        "http://localhost:3000/api/gifts/123e4567-e89b-5123-a456-426614174001"
      ),
      {
        params: Promise.resolve({
          giftId: "123e4567-e89b-5123-a456-426614174001",
        }),
      }
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: "Failed to fetch gift",
    })
    expect(logger.error).toHaveBeenCalledOnce()
  })
})
