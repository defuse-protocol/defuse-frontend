import type { NextRequest } from "next/server"
import { z } from "zod"

import type { AssetHoldersResponse } from "@src/app/api/integrations/dextools/types"

import { isErr, ok, tryCatch } from "../../../shared/result"
import type { ApiResult } from "../../../shared/types"
import { validateQueryParams } from "../../../shared/utils"

const querySchema = z.object({
  id: z.string(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
})

/**
 * Returns a paginated list of the largest token holders.
 * NOTE: This is a stub
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<AssetHoldersResponse> => {
    const res = validateQueryParams(request, querySchema)

    if (isErr(res)) {
      return res
    }

    return ok({ asset: { id: res.ok.id, totalHoldersCount: 0, holders: [] } })
  }
)
