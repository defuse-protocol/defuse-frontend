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

vi.mock("@src/utils/authJwt", () => ({
  verifyAppAuthToken: vi.fn().mockResolvedValue({ version: 1 }),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn((name: string) => {
      if (name === "defuse_active_wallet") return { value: "test-wallet" }
      if (name.startsWith("defuse_auth_")) return { value: "mock-jwt-token" }
      return undefined
    }),
  }),
}))

describe("POST /api/gifts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should create gift successfully", async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      error: null,
    })
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    })

    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/gifts`, {
        method: "POST",
        body: JSON.stringify({
          gift_id: "09e02623-d6b7-59be-ae65-0f562986ea14",
          encrypted_payload:
            "DMlO/ObmxvFplP8Xm6k7g5V0XFZd8PfAzJdX5hgBupHYW3odASMe/B/v2+zQdQw9Tu2cADi9H0oUfbK4gGHD79ik0WlIpAkQlJXPHkloqF8xLAVJZkn9i4KduNOKTIDGA58rEcN8v+dZd1kYiKAyH9t4fpzTsxYcI0bJNQIOvVwE4K/TB7MHw/nnbkiNvVWSuwVroQJ0Hw5eNQxfKfmhC6IutBmTP6aQCEMWtKAb6jkgEbSy3MIl/xzEAVFgk+BP/rWYjoGX3xgot6LhVEuZNe3aZDpLvwvdURUVwDwN6ABMBhYNW9u1Vmphk4r6qAD9HUuKltozBjX90q04G9VwGG9bkAqebnOvSrBwW3iXgEXQcMiQ9id2BvT7zfWFOUgelOlEfPwxQy+wnElx8NsP1RXXaOdp4ZgH6SzLOrh/2Lb6nKGn4s/d1G3yNLr+9GiOF3IySxiBZB6D17OPFFWm3ZmyoH3tpE5SkH1PAQRBYf3S+dKvbmE/8uvICvzoCcIvXU+O7W45sZIz9aloNERTG0hRxEfRAqLuMQG/WeQ5rLyJJzG2AUXe0AScO2KJD85xEdVM+JR0n6qCvfWkOmZkIQ==",
          p_key: "oNn2ERFTt5qfeqHeY8zKsO5CxfECNl8AhWvdRdD38sw",
        }),
      })
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      success: true,
    })
  })

  it("should return 400 for invalid data", async () => {
    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/gifts`, {
        method: "POST",
        body: JSON.stringify({
          gift_id: "09e02623-d6b7-59be-ae65-0f562986ea14",
          encrypted_payload: "invalid aes256",
          p_key: "invalid p_key",
        }),
      })
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it("should return 401 when not authenticated", async () => {
    const { cookies } = await import("next/headers")
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn(() => undefined),
      has: vi.fn(() => false),
      getAll: vi.fn(() => []),
      size: 0,
      [Symbol.iterator]: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    } as never)

    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/gifts`, {
        method: "POST",
        body: JSON.stringify({
          gift_id: "09e02623-d6b7-59be-ae65-0f562986ea14",
          encrypted_payload:
            "DMlO/ObmxvFplP8Xm6k7g5V0XFZd8PfAzJdX5hgBupHYW3odASMe/B/v2+zQdQw9Tu2cADi9H0oUfbK4gGHD79ik0WlIpAkQlJXPHkloqF8xLAVJZkn9i4KduNOKTIDGA58rEcN8v+dZd1kYiKAyH9t4fpzTsxYcI0bJNQIOvVwE4K/TB7MHw/nnbkiNvVWSuwVroQJ0Hw5eNQxfKfmhC6IutBmTP6aQCEMWtKAb6jkgEbSy3MIl/xzEAVFgk+BP/rWYjoGX3xgot6LhVEuZNe3aZDpLvwvdURUVwDwN6ABMBhYNW9u1Vmphk4r6qAD9HUuKltozBjX90q04G9VwGG9bkAqebnOvSrBwW3iXgEXQcMiQ9id2BvT7zfWFOUgelOlEfPwxQy+wnElx8NsP1RXXaOdp4ZgH6SzLOrh/2Lb6nKGn4s/d1G3yNLr+9GiOF3IySxiBZB6D17OPFFWm3ZmyoH3tpE5SkH1PAQRBYf3S+dKvbmE/8uvICvzoCcIvXU+O7W45sZIz9aloNERTG0hRxEfRAqLuMQG/WeQ5rLyJJzG2AUXe0AScO2KJD85xEdVM+JR0n6qCvfWkOmZkIQ==",
          p_key: "oNn2ERFTt5qfeqHeY8zKsO5CxfECNl8AhWvdRdD38sw",
        }),
      })
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Unauthorized" })
  })

  it("should return 500 when database insert fails", async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      error: new Error("DB error"),
    })
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    })

    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/gifts`, {
        method: "POST",
        body: JSON.stringify({
          gift_id: "09e02623-d6b7-59be-ae65-0f562986ea14",
          encrypted_payload:
            "DMlO/ObmxvFplP8Xm6k7g5V0XFZd8PfAzJdX5hgBupHYW3odASMe/B/v2+zQdQw9Tu2cADi9H0oUfbK4gGHD79ik0WlIpAkQlJXPHkloqF8xLAVJZkn9i4KduNOKTIDGA58rEcN8v+dZd1kYiKAyH9t4fpzTsxYcI0bJNQIOvVwE4K/TB7MHw/nnbkiNvVWSuwVroQJ0Hw5eNQxfKfmhC6IutBmTP6aQCEMWtKAb6jkgEbSy3MIl/xzEAVFgk+BP/rWYjoGX3xgot6LhVEuZNe3aZDpLvwvdURUVwDwN6ABMBhYNW9u1Vmphk4r6qAD9HUuKltozBjX90q04G9VwGG9bkAqebnOvSrBwW3iXgEXQcMiQ9id2BvT7zfWFOUgelOlEfPwxQy+wnElx8NsP1RXXaOdp4ZgH6SzLOrh/2Lb6nKGn4s/d1G3yNLr+9GiOF3IySxiBZB6D17OPFFWm3ZmyoH3tpE5SkH1PAQRBYf3S+dKvbmE/8uvICvzoCcIvXU+O7W45sZIz9aloNERTG0hRxEfRAqLuMQG/WeQ5rLyJJzG2AUXe0AScO2KJD85xEdVM+JR0n6qCvfWkOmZkIQ==",
          p_key: "oNn2ERFTt5qfeqHeY8zKsO5CxfECNl8AhWvdRdD38sw",
        }),
      })
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: "Failed to create gift",
    })
    expect(logger.error).toHaveBeenCalledOnce()
  })
})
