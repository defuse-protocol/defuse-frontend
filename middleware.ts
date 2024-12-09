import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { maintenanceModeFlag } from "@src/config/featureFlags"

export const config = {
  matcher:
    "/((?!api|_next/static|_next/image|favicon.ico|favicons|static|maintenance).*)",
}

export async function middleware(request: NextRequest) {
  try {
    const isMaintenanceMode = await maintenanceModeFlag()

    if (isMaintenanceMode) {
      return NextResponse.rewrite(new URL("/maintenance", request.url))
    }
  } catch (error) {
    // If feature flag evaluation fails, continue normally
    console.error("Feature flag evaluation error:", error)
  }

  return NextResponse.next()
}
