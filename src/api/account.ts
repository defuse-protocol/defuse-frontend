import axios from "axios"

import type { NearViewAccount, Result } from "@src/types/interfaces"
import { NEAR_NODE_URL } from "@src/utils/environment"

export const getViewAccount = (
  accountId: string | null
): Promise<Result<NearViewAccount>> =>
  axios
    .post(NEAR_NODE_URL, {
      jsonrpc: "2.0",
      id: "dontcare",
      method: "query",
      params: {
        request_type: "view_account",
        finality: "final",
        account_id: accountId,
      },
    })
    .then((resp) => resp.data)
