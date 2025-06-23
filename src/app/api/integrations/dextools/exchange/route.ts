import type { NextRequest } from "next/server"
import { z } from "zod"

import type {
  Exchange,
  ExchangeResponse,
} from "@src/app/api/integrations/dextools/types"

import { isErr, ok, tryCatch } from "../../shared/result"
import type { ApiResult } from "../../shared/types"
import { validateQueryParams } from "../../shared/utils"

const querySchema = z.object({ id: z.string() })

/**
 * Returns details for an individual DEX (factory / router).
 * NOTE: This is a stub
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<ExchangeResponse> => {
    const res = validateQueryParams(request, querySchema)

    if (isErr(res)) {
      return res
    }

    const exchange: Exchange = {
      factoryAddress: res.ok.id,
      name: "Stubbed Exchange",
      logoURL: "https://defuse.fi/logo_placeholder.png",
    }

    return ok({ exchange })
  }
)
