import { server } from "@src/tests/setup"
import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { getCachedSystemStatus } from "./systemStatus"

vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn) => fn),
}))

describe("systemStatus", () => {
  it("should return idle when there are no posts", async () => {
    server.use(
      http.get("https://status.near-intents.org/api/posts", async () => {
        return HttpResponse.json({ posts: [] })
      })
    )

    const systemStatus = await getCachedSystemStatus()
    expect(systemStatus).toEqual([])
  })

  it("should return maintenance when there is an active maintenance post", async () => {
    const now = Date.now()
    server.use(
      http.get("https://status.near-intents.org/api/posts", async () => {
        return HttpResponse.json({
          posts: [
            {
              id: "1",
              starts_at: now - 1000,
              ends_at: now + 1000,
              post_type: "maintenance",
              title: "Scheduled Maintenance",
            },
          ],
        })
      })
    )

    const systemStatus = await getCachedSystemStatus()
    expect(systemStatus).toEqual([
      {
        id: "1",
        status: "maintenance",
        message:
          "We're performing scheduled maintenance. Deposits and withdrawals may be temporarily unavailable.",
      },
    ])
  })

  it("should return idle when maintenance post has not started yet", async () => {
    const now = Date.now()
    server.use(
      http.get("https://status.near-intents.org/api/posts", async () => {
        return HttpResponse.json({
          posts: [
            {
              id: "1",
              starts_at: now + 1000,
              ends_at: now + 2000,
              post_type: "maintenance",
              title: "Future Maintenance",
            },
          ],
        })
      })
    )

    const systemStatus = await getCachedSystemStatus()
    expect(systemStatus).toEqual([])
  })

  it("should return idle when maintenance post has already ended", async () => {
    const now = Date.now()
    server.use(
      http.get("https://status.near-intents.org/api/posts", async () => {
        return HttpResponse.json({
          posts: [
            {
              id: "1",
              starts_at: now - 2000,
              ends_at: now - 1000,
              post_type: "maintenance",
              title: "Past Maintenance",
            },
          ],
        })
      })
    )

    const systemStatus = await getCachedSystemStatus()
    expect(systemStatus).toEqual([])
  })

  it("should return incident when there is an incident post", async () => {
    server.use(
      http.get("https://status.near-intents.org/api/posts", async () => {
        return HttpResponse.json({
          posts: [
            {
              id: "1",
              starts_at: null,
              ends_at: null,
              post_type: "incident",
              title: "Service Incident",
            },
          ],
        })
      })
    )

    const systemStatus = await getCachedSystemStatus()
    expect(systemStatus).toEqual([
      {
        id: "1",
        status: "incident",
        message: "Service Incident",
      },
    ])
  })

  it("should return null when HTTP request fails with invalid response", async () => {
    server.use(
      http.get("https://status.near-intents.org/api/posts", async () => {
        return HttpResponse.json(
          { error: "Internal Server Error" },
          { status: 500 }
        )
      })
    )

    const systemStatus = await getCachedSystemStatus()
    expect(systemStatus).toEqual(null)
  })

  it("should return null when response is not ok", async () => {
    server.use(
      http.get("https://status.near-intents.org/api/posts", async () => {
        return HttpResponse.json({ posts: [] }, { status: 404 })
      })
    )

    const systemStatus = await getCachedSystemStatus()
    expect(systemStatus).toEqual(null)
  })

  it("should return null when response schema is invalid", async () => {
    server.use(
      http.get("https://status.near-intents.org/api/posts", async () => {
        return HttpResponse.json({ invalid: "data" })
      })
    )

    const systemStatus = await getCachedSystemStatus()
    expect(systemStatus).toEqual(null)
  })
})
