import { supabase } from "@src/libs/supabase"
import { TEST_BASE_URL } from "@src/tests/setup"
import { logger } from "@src/utils/logger"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

vi.mock("@src/libs/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(),
    })),
  },
}))

vi.mock("@src/utils/logger", () => ({
  logger: { error: vi.fn() },
}))

describe("POST /api/webauthn_credentials", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should create credential successfully", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert })

    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/webauthn_credentials`, {
        method: "POST",
        body: JSON.stringify({
          raw_id: "5VJs8P7bXCgYo1HhVnwuVQ",
          public_key: "p256:9jjdnJ2vUn8jE7eUazd5VgDQo814yw5aTjzvuLgbAwZw",
          hostname: "localhost",
        }),
      })
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("should return 400 for invalid data", async () => {
    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/webauthn_credentials`, {
        method: "POST",
        body: JSON.stringify({
          raw_id: "invalid base58",
          public_key: "invalid base58",
          hostname: "",
        }),
      })
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it("should return 500 when database insert fails", async () => {
    const mockInsert = vi
      .fn()
      .mockResolvedValue({ error: new Error("DB error") })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert })

    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/webauthn_credentials`, {
        method: "POST",
        body: JSON.stringify({
          raw_id: "5VJs8P7bXCgYo1HhVnwuVQ",
          public_key: "p256:9jjdnJ2vUn8jE7eUazd5VgDQo814yw5aTjzvuLgbAwZw",
          hostname: "localhost",
        }),
      })
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: "Failed to create credential",
    })
    expect(logger.error).toHaveBeenCalledOnce()
  })
})
