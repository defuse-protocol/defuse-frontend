import { csp } from "@src/config/csp"
import { maintenanceModeFlag } from "@src/config/featureFlags"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const config = {
  matcher:
    "/((?!api|.well-known/vercel|_next/static|_next/image|favicon.ico|favicons|static|maintenance).*)",
}

export async function middleware(request: NextRequest) {
  try {
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
