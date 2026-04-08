import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@src/config/featureFlags", () => ({
  maintenanceModeFlag: vi.fn().mockResolvedValue(false),
}))

vi.mock("@src/config/csp", () => ({
  csp: () => ({
    nonce: "test-nonce",
    contentSecurityPolicyHeaderValue: "default-src 'self'",
  }),
}))

vi.mock("@src/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}))

// Dynamic import after mocks
const { proxy } = await import("./proxy")

const BASE = "http://localhost:3000"

function createRequest(
  path: string,
  options?: {
    cookies?: Record<string, string>
    headers?: Record<string, string>
  }
) {
  const req = new NextRequest(new URL(path, BASE), {
    headers: options?.headers ? new Headers(options.headers) : undefined,
  })
  if (options?.cookies) {
    for (const [name, value] of Object.entries(options.cookies)) {
      req.cookies.set(name, value)
    }
  }
  return req
}

describe("proxy — page routes", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("serves page routes normally", async () => {
    const res = await proxy(createRequest("/"))

    expect(res.status).toBe(200)
  })
})

describe("proxy — API route protection", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.unstubAllEnvs()
  })

  it("allows API requests with Sec-Fetch-Site: same-origin", async () => {
    const res = await proxy(
      createRequest("/api/gifts", {
        headers: { "sec-fetch-site": "same-origin" },
      })
    )

    expect(res.status).toBe(200)
  })

  it("blocks API requests with no origin headers", async () => {
    const res = await proxy(createRequest("/api/gifts"))

    expect(res.status).toBe(403)
  })

  it("blocks API requests from unknown origins", async () => {
    const res = await proxy(
      createRequest("/api/gifts", {
        headers: { origin: "https://evil.com" },
      })
    )

    expect(res.status).toBe(403)
  })

  it("allows requests from configured BASE_URL origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://app.defuse.org")

    const res = await proxy(
      createRequest("/api/gifts", {
        headers: { origin: "https://app.defuse.org" },
      })
    )

    expect(res.status).toBe(200)
  })

  it("allows requests from project Vercel preview deployments", async () => {
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "defuse-near.vercel.app")

    const res = await proxy(
      createRequest("/api/gifts", {
        headers: {
          origin: "https://defuse-near-abc123-team.vercel.app",
        },
      })
    )

    expect(res.status).toBe(200)
  })

  it("blocks requests from other Vercel projects", async () => {
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "defuse-near.vercel.app")

    const res = await proxy(
      createRequest("/api/gifts", {
        headers: { origin: "https://evil-project.vercel.app" },
      })
    )

    expect(res.status).toBe(403)
  })

  it("allows localhost in non-production env", async () => {
    const res = await proxy(
      createRequest("/api/gifts", {
        headers: { origin: "http://localhost:3000" },
      })
    )

    expect(res.status).toBe(200)
  })
})

describe("proxy — rate limiting", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("returns 429 after exceeding request limit from the same IP", async () => {
    const makeRequest = () =>
      proxy(
        createRequest("/api/gifts", {
          headers: {
            "sec-fetch-site": "same-origin",
            "x-real-ip": "10.0.0.1",
          },
        })
      )

    // Exhaust the limit
    for (let i = 0; i < 100; i++) {
      await makeRequest()
    }

    // Next request exceeds limit
    const res = await makeRequest()

    expect(res.status).toBe(429)
  })

  it("tracks limits per IP independently", async () => {
    // Exhaust limit for one IP
    for (let i = 0; i < 100; i++) {
      await proxy(
        createRequest("/api/gifts", {
          headers: {
            "sec-fetch-site": "same-origin",
            "x-real-ip": "10.0.0.2",
          },
        })
      )
    }

    // Different IP is not affected
    const res = await proxy(
      createRequest("/api/gifts", {
        headers: {
          "sec-fetch-site": "same-origin",
          "x-real-ip": "10.0.0.3",
        },
      })
    )

    expect(res.status).toBe(200)
  })
})
