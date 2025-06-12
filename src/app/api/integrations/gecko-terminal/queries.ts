import { PAIR_SEPARATOR } from "./utils"

export const EVENTS_QUERY = `
SELECT
  CAST(d.block_height AS UInt32) AS blockNumber,
  toUnixTimestamp(d.block_timestamp) AS blockTimestamp,
  'swap' AS eventType,
  d.tx_hash AS txnId,
  0 AS txnIndex,
  CAST(MIN(d.index_in_log) AS UInt32) AS eventIndex,
  argMax(d.account_id, d.token_in IS NOT NULL) AS maker,
  concat(
    argMax(d.token_in, d.token_in IS NOT NULL),
    '${PAIR_SEPARATOR}',
    argMax(d.token_out, d.token_out IS NOT NULL)
  ) AS pairId,
  printf('%.0f', sumIf(abs(d.amount_in), d.amount_in IS NOT NULL)) AS asset0In,
  printf('%.0f', sumIf(d.amount_out, d.amount_out IS NOT NULL)) AS asset1Out,
  printf('%.0f', sumIf(abs(d.amount_in), d.amount_in IS NOT NULL)) AS reserveAsset0,
  printf('%.0f', sumIf(d.amount_out, d.amount_out IS NOT NULL)) AS reserveAsset1,
  argMax(asset_in.decimals, d.token_in IS NOT NULL) AS asset0Decimals,
  argMax(asset_out.decimals, d.token_out IS NOT NULL) AS asset1Decimals
FROM
  near_intents_db.silver_dip4_token_diff_new d
  LEFT JOIN near_intents_db.defuse_assets asset_in ON d.token_in = asset_in.defuse_asset_id
  LEFT JOIN near_intents_db.defuse_assets asset_out ON d.token_out = asset_out.defuse_asset_id
WHERE
  d.tokens_cnt = 2
  AND d.tx_hash IS NOT NULL
  AND d.intent_hash IS NOT NULL
  AND d.block_height >= { fromBlock :UInt32 }
  AND d.block_height <= { toBlock :UInt32 }
GROUP BY
  d.block_height,
  d.block_timestamp,
  d.block_hash,
  d.tx_hash,
  d.intent_hash,
  d.account_id,
  d.contract_id
HAVING
  count(DISTINCT d.token_out) = 1
  AND count(DISTINCT d.token_in) = 1
  AND asset0Decimals != 0
  AND asset1Decimals != 0
ORDER BY
  d.block_height ASC,
  MIN(d.index_in_log) ASC`
