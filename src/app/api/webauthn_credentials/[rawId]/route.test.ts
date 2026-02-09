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

describe("GET /api/webauthn_credentials/[rawId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return credential when found", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        public_key: "2Kc5WSg4kBsxQXBuBPjEH9",
        hostname: "near-intents.org",
      },
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect })

    const response = await GET(
      new Request(
        "http://localhost:3000/api/webauthn_credentials/5VJs8P7bXCgYo1HhVnwuVQ"
      ),
      { params: Promise.resolve({ rawId: "5VJs8P7bXCgYo1HhVnwuVQ" }) }
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      public_key: "2Kc5WSg4kBsxQXBuBPjEH9",
      hostname: "near-intents.org",
    })
  })

  it("should return 404 when credential not found", async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect })

    const response = await GET(
      new Request(
        "http://localhost:3000/api/webauthn_credentials/5VJs8P7bXCgYo1HhVnwuVQ"
      ),
      { params: Promise.resolve({ rawId: "5VJs8P7bXCgYo1HhVnwuVQ" }) }
    )

    expect(response.status).toBe(404)
  })

  it("should return 400 for invalid rawId", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/webauthn_credentials/invalid"),
      { params: Promise.resolve({ rawId: "invalid" }) }
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
        "http://localhost:3000/api/webauthn_credentials/5VJs8P7bXCgYo1HhVnwuVQ"
      ),
      { params: Promise.resolve({ rawId: "5VJs8P7bXCgYo1HhVnwuVQ" }) }
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: "Failed to fetch credential",
      code: "INTERNAL_ERROR",
    })
    expect(logger.error).toHaveBeenCalledOnce()
  })
})
