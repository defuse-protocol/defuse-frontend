import { supabase } from "@src/libs/supabase"
import { TEST_BASE_URL } from "@src/tests/setup"
import { logger } from "@src/utils/logger"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PUT } from "./route"

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

describe("PUT /api/otc_trades", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should create or update otc trade successfully", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert })

    const response = await PUT(
      new Request(`${TEST_BASE_URL}/api/otc_trades`, {
        method: "PUT",
        body: JSON.stringify({
          raw_id: "vi97r57ot-3e1x447a64c2zto",
          encrypted_payload:
            "ab7kcnLhc0FYlE1W-5f6P-KuHj39ufuyThgGI-xS_fDUxA3mzTrY0imPTLMc0S1maUtoRxnteEXoXXgytEKiXHM4_1ZZrA3Drz1d57eYTvytOEj5SHTmQZGIwYip5Ue9-ccves5vcOaZQkj3JpG0tscpGKqLpdPX8X3NLCE9OQvhHmh_514pIGDEuRK53v1t42fP-DNAbjrmO_8NG4UwsMtS7uUz2aC3UbcmzUOUdC9Ps-9yhq7fanRE0aLbrl-b1XZb-g4Pu0_7aCvNg68MQOY5vUVE6Mqd1fMlfMwWZ_tHlOAG",
          hostname: "localhost",
        }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("should return 400 for invalid data", async () => {
    const response = await PUT(
      new Request(`${TEST_BASE_URL}/api/otc_trades`, {
        method: "PUT",
        body: JSON.stringify({
          raw_id: "invalid-format-not-25-chars",
          encrypted_payload: "invalid aes256",
          hostname: "",
        }),
      })
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it("should return 500 when database upsert fails", async () => {
    const mockUpsert = vi
      .fn()
      .mockResolvedValue({ error: new Error("DB error") })
    vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert })

    const response = await PUT(
      new Request(`${TEST_BASE_URL}/api/otc_trades`, {
        method: "PUT",
        body: JSON.stringify({
          raw_id: "vi97r57ot-3e1x447a64c2zto",
          encrypted_payload:
            "ab7kcnLhc0FYlE1W-5f6P-KuHj39ufuyThgGI-xS_fDUxA3mzTrY0imPTLMc0S1maUtoRxnteEXoXXgytEKiXHM4_1ZZrA3Drz1d57eYTvytOEj5SHTmQZGIwYip5Ue9-ccves5vcOaZQkj3JpG0tscpGKqLpdPX8X3NLCE9OQvhHmh_514pIGDEuRK53v1t42fP-DNAbjrmO_8NG4UwsMtS7uUz2aC3UbcmzUOUdC9Ps-9yhq7fanRE0aLbrl-b1XZb-g4Pu0_7aCvNg68MQOY5vUVE6Mqd1fMlfMwWZ_tHlOAG",
          hostname: "localhost",
        }),
      })
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: "Failed to create or update otc trade",
    })
    expect(logger.error).toHaveBeenCalledOnce()
  })
})
