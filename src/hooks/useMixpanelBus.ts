import type { Dict } from "mixpanel-browser"
import { useCallback, useEffect } from "react"

import { serialize, setEventEmitter } from "@defuse-protocol/defuse-sdk/utils"
import { useMixpanel } from "@src/providers/MixpanelProvider"
import bus from "@src/services/EventBus"
import { logger } from "@src/utils/logger"

const events = [
  "gift_created",
  "deposit_initiated",
  "deposit_success",
  "gift_claimed",
  "otc_deal_initiated",
  "swap_initiated",
  "swap_confirmed",
  "otc_confirmed",
  "withdrawal_initiated",
  "withdrawal_confirmed",
]

export function useMixpanelBus() {
  const mixPanel = useMixpanel()

  useEffect(() => {
    setEventEmitter(bus)
  }, [])

  const sendMixPanelEvent = useCallback(
    (eventName: string, payload: Dict) => {
      console.log("mixPanel", mixPanel)
      mixPanel?.track(eventName, JSON.parse(serialize(payload)))
    },
    [mixPanel]
  )

  useEffect(() => {
    if (bus) {
      for (const event of events) {
        bus.on(event, (payload: Dict) => {
          sendMixPanelEvent(event, payload)
        })
      }
    } else {
      logger.error("event bus is not defined")
    }
  }, [sendMixPanelEvent])

  return mixPanel
}
