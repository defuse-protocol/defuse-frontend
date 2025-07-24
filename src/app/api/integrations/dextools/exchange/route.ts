import type { NextRequest } from "next/server"
import { z } from "zod"

import type {
  Exchange,
  ExchangeResponse,
} from "@src/app/api/integrations/dextools/types"

import { CONTRACT_ADDRESS } from "../../shared/constants"
import { err, isErr, ok, tryCatch } from "../../shared/result"
import type { ApiResult } from "../../shared/types"
import { validateQueryParams } from "../../shared/utils"

const querySchema = z.object({ id: z.string() })
/**
 * Returns details for an individual DEX (factory / router).
 * test:
 * http://localhost:3000/api/integrations/dextools/exchange?id=intents.near
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<ExchangeResponse> => {
    const res = validateQueryParams(request, querySchema)

    if (isErr(res)) {
      return res
    }

    if (res.ok.id !== CONTRACT_ADDRESS) {
      return err(
        "Not Found",
        `Exchange not found for ${res.ok.id}. ${CONTRACT_ADDRESS} is the only supported exchange.`
      )
    }

    const exchange: Exchange = {
      factoryAddress: CONTRACT_ADDRESS,
      name: "Near Intents",
      logoURL:
        "https://near-intents.org/favicons/near-intents/android-chrome-192x192.png",
    }

    return ok({ exchange })
  }
)
