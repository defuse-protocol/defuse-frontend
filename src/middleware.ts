import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { csp } from "@src/config/csp"
import { maintenanceModeFlag } from "@src/config/featureFlags"
import { logger } from "@src/utils/logger"

import { verifyApiKey } from "./app/api/integrations/shared/api-auth"

export const config = {
  matcher:
    "/(api/integrations.*|(?!api|.well-known/vercel|_next/static|_next/image|favicon.ico|favicons|static|maintenance).*)",
}

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)

  if (url.pathname.startsWith("/api/integrations")) {
    const authResult = await verifyApiKey(request)

    if (authResult.err) {
      return NextResponse.json(authResult.err.error, {
        status: authResult.err.status,
      })
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-jwt-payload", JSON.stringify(authResult.ok))

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
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
