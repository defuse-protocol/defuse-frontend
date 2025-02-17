import { logger } from "@src/utils/logger"
import { get } from "@vercel/edge-config"
import { unstable_flag as flag } from "@vercel/flags/next"
import { headers } from "next/headers"

export type WhitelabelTemplateValue =
  | "near-intents"
  | "solswap"
  | "dogecoinswap"
  | "turboswap"
  | "trumpswap"

const domains: Record<string, WhitelabelTemplateValue> = {
  "app.near-intents.org": "near-intents",
  "solswap.org": "solswap",
  "dogecoinswap.org": "dogecoinswap",
  "turboswap.org": "turboswap",
  "trump-swap.org": "trumpswap",
}

export const whitelabelTemplateFlag = flag({
  key: "whitelabelTemplate",
  defaultValue: "near-intents" as WhitelabelTemplateValue,
  options: [
    { label: "near-intents.org", value: "near-intents" },
    { label: "SolSwap.org", value: "solswap" },
    { label: "DogecoinSwap.org", value: "dogecoinswap" },
    { label: "TurboSwap.org", value: "turboswap" },
    { label: "trump-swap.org", value: "trumpswap" },
  ],
  decide(): WhitelabelTemplateValue {
    const host = headers().get("host")
    if (host != null) {
      if (domains[host]) {
        return domains[host]
      }
    }

    return "near-intents"
  },
})

export const maintenanceModeFlag = flag({
  key: "maintenanceMode",
  defaultValue: false as boolean,
  options: [
    { label: "On", value: true },
    { label: "Off", value: false },
  ],
  async decide() {
    try {
      const isMaintenanceMode = await get("isMaintenanceMode")
      return isMaintenanceMode === true
    } catch (err) {
      logger.error(err)
      return false
    }
  },
})
