import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { csp } from "@src/config/csp"
import {
  dealsDisabledFlag,
  depositsDisabledFlag,
  earnDisabledFlag,
  maintenanceModeFlag,
  swapDisabledFlag,
  withdrawDisabledFlag,
} from "@src/config/featureFlags"
import { logger } from "@src/utils/logger"

export const config = {
  matcher:
    "/((?!api|.well-known/vercel|_next/static|_next/image|favicon.ico|favicons|static|maintenance|monitoring).*)",
}

const featureRouteMap = [
  { pathPrefix: "/swap", flag: swapDisabledFlag },
  { pathPrefix: "/deposit", flag: depositsDisabledFlag },
  { pathPrefix: "/transfer", flag: withdrawDisabledFlag },
  { pathPrefix: "/deals", flag: dealsDisabledFlag },
  { pathPrefix: "/deal", flag: dealsDisabledFlag },
  { pathPrefix: "/earn", flag: earnDisabledFlag },
]

export async function proxy(request: NextRequest) {
  try {
    const legacyRedirect = handleLegacyRedirects(request)
    if (legacyRedirect) {
      return legacyRedirect
    }

    const pathname = new URL(request.url).pathname
    const matchedRoute = featureRouteMap.find(
      (route) =>
        pathname === route.pathPrefix ||
        pathname.startsWith(`${route.pathPrefix}/`)
    )

    const [isMaintenanceMode, isFeatureDisabled] = await Promise.all([
      maintenanceModeFlag(),
      matchedRoute ? matchedRoute.flag() : Promise.resolve(false),
    ])

    if (isMaintenanceMode || isFeatureDisabled) {
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

  if (
    url.pathname === "/otc-desk/create-order" ||
    url.pathname === "/otc/create-order"
  ) {
    return NextResponse.redirect(new URL("/deals/new", request.url))
  }

  if (
    url.pathname === "/otc-desk/view-order" ||
    url.pathname === "/otc/order"
  ) {
    const newUrl = new URL("/deal", request.url)

    const orderParam = url.searchParams.get("order")
    if (orderParam) {
      newUrl.searchParams.set("order", orderParam)
    }

    return NextResponse.redirect(newUrl)
  }

  return null
}
