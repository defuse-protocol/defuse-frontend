import { base64urlnopad } from "@scure/base"
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

describe("POST /api/otc_trades", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should create otc trade successfully with iv", async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      error: null,
    })
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    })

    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/otc_trades`, {
        method: "POST",
        body: JSON.stringify({
          encrypted_payload:
            "DMlO/ObmxvFplP8Xm6k7g5V0XFZd8PfAzJdX5hgBupHYW3odASMe/B/v2+zQdQw9Tu2cADi9H0oUfbK4gGHD79ik0WlIpAkQlJXPHkloqF8xLAVJZkn9i4KduNOKTIDGA58rEcN8v+dZd1kYiKAyH9t4fpzTsxYcI0bJNQIOvVwE4K/TB7MHw/nnbkiNvVWSuwVroQJ0Hw5eNQxfKfmhC6IutBmTP6aQCEMWtKAb6jkgEbSy3MIl/xzEAVFgk+BP/rWYjoGX3xgot6LhVEuZNe3aZDpLvwvdURUVwDwN6ABMBhYNW9u1Vmphk4r6qAD9HUuKltozBjX90q04G9VwGG9bkAqebnOvSrBwW3iXgEXQcMiQ9id2BvT7zfWFOUgelOlEfPwxQy+wnElx8NsP1RXXaOdp4ZgH6SzLOrh/2Lb6nKGn4s/d1G3yNLr+9GiOF3IySxiBZB6D17OPFFWm3ZmyoH3tpE5SkH1PAQRBYf3S+dKvbmE/8uvICvzoCcIvXU+O7W45sZIz9aloNERTG0hRxEfRAqLuMQG/WeQ5rLyJJzG2AUXe0AScO2KJD85xEdVM+JR0n6qCvfWkOmZkIQ==",
          iv: "e9QTDukeRo97zGVZ",
        }),
      })
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      success: true,
    })
  })

  it("should create otc trade successfully with p_key", async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      error: null,
    })
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    })

    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/otc_trades`, {
        method: "POST",
        body: JSON.stringify({
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
    const mockInsert = vi.fn().mockResolvedValue({
      error: new Error("DB error"),
    })
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    })

    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/otc_trades`, {
        method: "POST",
        body: JSON.stringify({
          encrypted_payload:
            "DMlO/ObmxvFplP8Xm6k7g5V0XFZd8PfAzJdX5hgBupHYW3odASMe/B/v2+zQdQw9Tu2cADi9H0oUfbK4gGHD79ik0WlIpAkQlJXPHkloqF8xLAVJZkn9i4KduNOKTIDGA58rEcN8v+dZd1kYiKAyH9t4fpzTsxYcI0bJNQIOvVwE4K/TB7MHw/nnbkiNvVWSuwVroQJ0Hw5eNQxfKfmhC6IutBmTP6aQCEMWtKAb6jkgEbSy3MIl/xzEAVFgk+BP/rWYjoGX3xgot6LhVEuZNe3aZDpLvwvdURUVwDwN6ABMBhYNW9u1Vmphk4r6qAD9HUuKltozBjX90q04G9VwGG9bkAqebnOvSrBwW3iXgEXQcMiQ9id2BvT7zfWFOUgelOlEfPwxQy+wnElx8NsP1RXXaOdp4ZgH6SzLOrh/2Lb6nKGn4s/d1G3yNLr+9GiOF3IySxiBZB6D17OPFFWm3ZmyoH3tpE5SkH1PAQRBYf3S+dKvbmE/8uvICvzoCcIvXU+O7W45sZIz9aloNERTG0hRxEfRAqLuMQG/WeQ5rLyJJzG2AUXe0AScO2KJD85xEdVM+JR0n6qCvfWkOmZkIQ==",
          iv: "e9QTDukeRo97zGVZ",
        }),
      })
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: "Failed to create otc trade",
    })
    expect(logger.error).toHaveBeenCalledOnce()
  })

  it("should return 400 for invalid p_key data", async () => {
    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/otc_trades`, {
        method: "POST",
        body: JSON.stringify({
          encrypted_payload:
            "DMlO/ObmxvFplP8Xm6k7g5V0XFZd8PfAzJdX5hgBupHYW3odASMe/B/v2+zQdQw9Tu2cADi9H0oUfbK4gGHD79ik0WlIpAkQlJXPHkloqF8xLAVJZkn9i4KduNOKTIDGA58rEcN8v+dZd1kYiKAyH9t4fpzTsxYcI0bJNQIOvVwE4K/TB7MHw/nnbkiNvVWSuwVroQJ0Hw5eNQxfKfmhC6IutBmTP6aQCEMWtKAb6jkgEbSy3MIl/xzEAVFgk+BP/rWYjoGX3xgot6LhVEuZNe3aZDpLvwvdURUVwDwN6ABMBhYNW9u1Vmphk4r6qAD9HUuKltozBjX90q04G9VwGG9bkAqebnOvSrBwW3iXgEXQcMiQ9id2BvT7zfWFOUgelOlEfPwxQy+wnElx8NsP1RXXaOdp4ZgH6SzLOrh/2Lb6nKGn4s/d1G3yNLr+9GiOF3IySxiBZB6D17OPFFWm3ZmyoH3tpE5SkH1PAQRBYf3S+dKvbmE/8uvICvzoCcIvXU+O7W45sZIz9aloNERTG0hRxEfRAqLuMQG/WeQ5rLyJJzG2AUXe0AScO2KJD85xEdVM+JR0n6qCvfWkOmZkIQ==",
          p_key: "invalid-key",
        }),
      })
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it("should return 400 when both iv and p_key are provided", async () => {
    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/otc_trades`, {
        method: "POST",
        body: JSON.stringify({
          encrypted_payload:
            "DMlO/ObmxvFplP8Xm6k7g5V0XFZd8PfAzJdX5hgBupHYW3odASMe/B/v2+zQdQw9Tu2cADi9H0oUfbK4gGHD79ik0WlIpAkQlJXPHkloqF8xLAVJZkn9i4KduNOKTIDGA58rEcN8v+dZd1kYiKAyH9t4fpzTsxYcI0bJNQIOvVwE4K/TB7MHw/nnbkiNvVWSuwVroQJ0Hw5eNQxfKfmhC6IutBmTP6aQCEMWtKAb6jkgEbSy3MIl/xzEAVFgk+BP/rWYjoGX3xgot6LhVEuZNe3aZDpLvwvdURUVwDwN6ABMBhYNW9u1Vmphk4r6qAD9HUuKltozBjX90q04G9VwGG9bkAqebnOvSrBwW3iXgEXQcMiQ9id2BvT7zfWFOUgelOlEfPwxQy+wnElx8NsP1RXXaOdp4ZgH6SzLOrh/2Lb6nKGn4s/d1G3yNLr+9GiOF3IySxiBZB6D17OPFFWm3ZmyoH3tpE5SkH1PAQRBYf3S+dKvbmE/8uvICvzoCcIvXU+O7W45sZIz9aloNERTG0hRxEfRAqLuMQG/WeQ5rLyJJzG2AUXe0AScO2KJD85xEdVM+JR0n6qCvfWkOmZkIQ==",
          iv: "e9QTDukeRo97zGVZ",
          p_key: "oNn2ERFTt5qfeqHeY8zKsO5CxfECNl8AhWvdRdD38sw",
        }),
      })
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })
})
