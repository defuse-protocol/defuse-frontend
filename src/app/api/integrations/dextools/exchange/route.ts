import type { NextRequest } from "next/server"

import type {
  Exchange,
  ExchangeResponse,
} from "@src/app/api/integrations/dextools/types"

import { err, ok, tryCatch } from "../../shared/result"
import type { ApiResult } from "../../shared/types"

/**
 * Returns details for an individual DEX (factory / router).
 * NOTE: This is a stub
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<ExchangeResponse> => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return err("Bad Request", "Missing id parameter")
    }

    const exchange: Exchange = {
      factoryAddress: id,
      name: "Stubbed Exchange",
      logoURL: "https://defuse.fi/logo_placeholder.png",
    }

    return ok({ exchange })
  }
)
