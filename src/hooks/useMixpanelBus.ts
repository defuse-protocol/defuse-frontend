import type { Dict } from "mixpanel-browser"
import { useCallback, useEffect } from "react"

import { serialize, setEventEmitter } from "@src/components/DefuseSDK/utils"
import { useMixpanel } from "@src/providers/MixpanelProvider"
import bus from "@src/services/EventBus"
import { logger } from "@src/utils/logger"

const events = [
  "gift_created",
  "gift_claimed",
  "gift_link_shared",
  "gift_link_viewed",
  "gift_link_refunded",
  "deposit_initiated",
  "deposit_success",
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
    // @ts-expect-error TODO: fix later
    setEventEmitter(bus)
  }, [])

  const sendMixPanelEvent = useCallback(
    (eventName: string, payload: Dict) => {
      mixPanel?.track(eventName, JSON.parse(serialize(payload)))
    },
    [mixPanel]
  )

  useEffect(() => {
    if (bus) {
      const listeners: Array<(payload: Dict) => void> = []

      for (const event of events) {
        const listener = (payload: Dict) => {
          sendMixPanelEvent(event, payload)
        }
        listeners.push(listener)
        bus.on(event, listener)
      }

      return () => {
        if (bus) {
          for (let i = 0; i < events.length; i++) {
            bus.removeListener(events[i], listeners[i])
          }
        }
      }
    }

    logger.error("event bus is not defined")
  }, [sendMixPanelEvent])

  return mixPanel
}
