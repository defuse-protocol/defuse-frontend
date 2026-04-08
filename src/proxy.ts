import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { csp } from "@src/config/csp"
import { maintenanceModeFlag } from "@src/config/featureFlags"
import { logger } from "@src/utils/logger"

export const config = {
  matcher: [
    // Page routes (everything except static assets, monitoring, etc.)
    "/((?!api|health|up|.well-known/vercel|_next/static|_next/image|favicon.ico|favicons|static|maintenance|monitoring).*)",
    // API routes (except cron, which is called by Vercel with no Origin header)
    "/api/((?!cron/).*)",
  ],
}

export async function proxy(request: NextRequest) {
  const pathname = new URL(request.url).pathname

  // Protect API routes: CSRF check + rate limiting
  if (pathname.startsWith("/api/")) {
    if (!isAllowedRequest(request)) {
      return new NextResponse(null, { status: 403 })
    }

    // x-real-ip is set by Vercel to the actual client IP (not spoofable).
    // Falls back to x-forwarded-for last entry (appended by the trusted proxy).
    const ip =
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ??
      "unknown"
    if (!apiRateLimiter.check(ip)) {
      return new NextResponse(null, { status: 429 })
    }

    return NextResponse.next()
  }

  try {
    // Check for legacy redirects first
    const legacyRedirect = handleLegacyRedirects(request)
    if (legacyRedirect) {
      return legacyRedirect
    }

    const isMaintenanceMode = await maintenanceModeFlag()

    if (isMaintenanceMode) {
      return NextResponse.rewrite(new URL("/maintenance", request.url))
    }
  } catch (error) {
    // If feature flag evaluation fails, continue normally
    logger.error(error)
  }

  const { nonce, contentSecurityPolicyHeaderValue } = csp()

  /** Request headers */
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  )

  /**  Response headers */
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  )

  return response
}

function isAllowedRequest(request: NextRequest): boolean {
  // Sec-Fetch-Site is set automatically by browsers and cannot be spoofed by JS.
  // "same-origin" means the request came from our own app in the browser.
  const secFetchSite = request.headers.get("sec-fetch-site")
  if (secFetchSite === "same-origin") return true

  // For cross-origin browser requests (e.g. Vercel preview → production API),
  // validate the Origin header against our allowlist.
  const origin = request.headers.get("origin")
  if (origin) {
    return isAllowedOrigin(origin)
  }

  // No Sec-Fetch-Site and no Origin → non-browser client (curl, scripts) → block.
  return false
}

function isAllowedOrigin(origin: string): boolean {
  try {
    const originUrl = new URL(origin)

    // Allow Vercel preview deployments scoped to this project only.
    // VERCEL_PROJECT_PRODUCTION_URL is e.g. "defuse-near.vercel.app", so
    // previews are "defuse-near-<hash>-<team>.vercel.app" or similar.
    const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    if (productionUrl) {
      // Extract project name prefix (e.g. "defuse-near" from "defuse-near.vercel.app")
      const projectPrefix = productionUrl.replace(/\.vercel\.app$/, "")
      if (
        originUrl.hostname === productionUrl ||
        (originUrl.hostname.endsWith(".vercel.app") &&
          originUrl.hostname.startsWith(`${projectPrefix}-`))
      ) {
        return true
      }
    }

    // Allow configured BASE_URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    if (baseUrl && new URL(baseUrl).origin === origin) return true

    // Allow localhost only in development
    if (
      process.env.NODE_ENV !== "production" &&
      originUrl.hostname === "localhost"
    ) {
      return true
    }
  } catch (error) {
    logger.warn("Failed to parse origin for allowlist check", {
      origin,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }

  return false
}

/**
 * Simple fixed-window rate limiter (in-memory, per Vercel instance).
 * Not a hard security boundary — use for basic abuse prevention.
 * Note: allows up to 2x burst at window boundaries.
 */
class RateLimiter {
  private windows = new Map<string, { count: number; resetAt: number }>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  check(key: string): boolean {
    const now = Date.now()

    // Lazy eviction: purge expired entries when the map gets large
    if (this.windows.size > 10_000) {
      for (const [k, v] of this.windows) {
        if (now >= v.resetAt) this.windows.delete(k)
      }
    }

    const entry = this.windows.get(key)

    if (!entry || now >= entry.resetAt) {
      this.windows.set(key, { count: 1, resetAt: now + this.windowMs })
      return true
    }

    entry.count++
    if (entry.count > this.maxRequests) {
      return false
    }
    return true
  }
}

// 100 requests per 60 seconds per IP
const apiRateLimiter = new RateLimiter(100, 60_000)

function handleLegacyRedirects(request: NextRequest): NextResponse | null {
  const url = new URL(request.url)

  if (url.pathname === "/otc-desk/create-order") {
    return NextResponse.redirect(new URL("/otc/create-order", request.url))
  }

  if (url.pathname === "/otc-desk/view-order") {
    const newUrl = new URL("/otc/order", request.url)

    const orderParam = url.searchParams.get("order")
    if (orderParam) {
      newUrl.searchParams.set("order", orderParam)
    }

    return NextResponse.redirect(newUrl)
  }

  return null
}
