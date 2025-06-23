import type { NextRequest } from "next/server"

import type { AssetHoldersResponse } from "@src/app/api/integrations/dextools/types"

import { err, ok, tryCatch } from "../../../shared/result"
import type { ApiResult } from "../../../shared/types"

/**
 * Returns a paginated list of the largest token holders.
 * NOTE: This is a stub
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<AssetHoldersResponse> => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return err("Bad Request", "Missing id parameter")
    }

    return ok({ asset: { id, totalHoldersCount: 0, holders: [] } })
  }
)
