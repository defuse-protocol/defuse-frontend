import axios from "axios"
import { v4 } from "uuid"

import { NEAR_NODE_URL_2 } from "@src/utils/environment"

export const getNearTransactionDetails = (
  transactionHash: string,
  accountId: string
) =>
  axios
    .post(NEAR_NODE_URL_2, {
      jsonrpc: "2.0",
      id: v4(),
      method: "tx",
      params: {
        tx_hash: transactionHash,
        sender_account_id: accountId,
        wait_until: "EXECUTED",
      },
    })
    .then((resp) => resp.data)
    .catch((resp) => resp.error)

export const getNearFinalBlock = () =>
  axios
    .post(NEAR_NODE_URL_2, {
      id: v4(),
      jsonrpc: "2.0",
      method: "block",
      params: {
        finality: "final",
      },
    })
    .then((resp) => resp.data)

export const getNearBlockById = (block_hash?: string) =>
  axios
    .post(NEAR_NODE_URL_2, {
      id: v4(),
      jsonrpc: "2.0",
      method: "block",
      params: {
        block_id: block_hash,
      },
    })
    .then((resp) => resp.data)
