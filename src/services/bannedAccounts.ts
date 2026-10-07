import { logger } from "@src/utils/logger"
import { get } from "@vercel/edge-config"
import * as v from "valibot"

const EDGE_CONFIG_KEY = "bannedAccountIds"
const BannedListSchema = v.array(v.string())

async function getBannedAccountIds(): Promise<string[]> {
  const raw = await get(EDGE_CONFIG_KEY)
  if (raw === undefined) {
    logger.warn(
      `Edge Config key "${EDGE_CONFIG_KEY}" is not set; treating list as empty`
    )
    return []
  }
  return v.parse(BannedListSchema, raw)
}

export async function isAccountBanned(accountId: string): Promise<boolean> {
  try {
    const ids = await getBannedAccountIds()
    return ids.includes(accountId)
  } catch (err) {
    logger.error("Failed to load banned account list; failing closed", { err })
    return true
  }
}
