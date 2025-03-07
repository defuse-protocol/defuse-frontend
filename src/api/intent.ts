import axios from "axios"
import { v4 } from "uuid"

import { SOLVER_RELAY_0_URL } from "@src/utils/environment"

export type PublishAtomicNearIntentProps = {
  hash: string
  accountId: string
  intentId: string
  defuseAssetIdIn: string
  defuseAssetIdOut: string
  unitsAmountIn: string
  unitsAmountOut: string
}

export const getSupportTokenListSolver0 = () =>
  axios
    .post(SOLVER_RELAY_0_URL, {
      id: v4(),
      jsonrpc: "2.0",
      method: "supported_tokens",
      params: [],
    })
    .then((resp) => resp.data)

export const getTokenFormatSolver0 = (token: string) =>
  axios
    .post(SOLVER_RELAY_0_URL, {
      id: v4(),
      jsonrpc: "2.0",
      method: "discover_defuse_assets",
      params: [token],
    })
    .then((resp) => resp.data)

export const getPublishAtomicNearIntent = ({
  hash,
  defuseAssetIdIn,
  accountId,
  intentId,
  defuseAssetIdOut,
  unitsAmountIn,
  unitsAmountOut,
}: PublishAtomicNearIntentProps) =>
  axios
    .post(SOLVER_RELAY_0_URL, {
      jsonrpc: "2.0",
      method: "publish_intent",
      params: [
        {
          intent_type: "atomic_near",
          intent_creation_hash: hash,
          intent_id: intentId,
          intent_initiator: accountId,
          defuse_asset_identifier_in: defuseAssetIdIn, //Data Dublication for Dev purpose. Should not be used in production
          defuse_asset_identifier_out: defuseAssetIdOut,
          amount_in: unitsAmountIn,
          amount_out_desired: unitsAmountOut,
        },
      ],
    })
    .then((resp) => resp.data)
