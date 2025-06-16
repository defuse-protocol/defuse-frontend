import type { Dict } from "mixpanel-browser"
import { useEffect } from "react"

import { setEventEmitter } from "@defuse-protocol/defuse-sdk/utils"
import { useMixpanel } from "@src/providers/MixpanelProvider"
import bus from "@src/services/EventBus"

export function useMixpanelBus() {
  const mixPanel = useMixpanel()

  useEffect(() => {
    setEventEmitter(bus)
  }, [])

  useEffect(() => {
    const sendMixPanelEvent = (eventName: string, payload: Dict) => {
      mixPanel?.track(eventName, payload)
    }

    bus.on("gift_created", (payload: Dict) => {
      console.log("gift_created", payload)
      sendMixPanelEvent("gift_created", payload)
    })
    bus.on("deposit_initiated", (payload: Dict) => {
      console.log("deposit_initiated", payload)
      sendMixPanelEvent("deposit_initiated", payload)
    })
    bus.on("deposit_success", (payload: Dict) => {
      console.log("deposit_success", payload)
      sendMixPanelEvent("deposit_success", payload)
    })
    bus.on("gift_claimed", (payload: Dict) => {
      console.log("gift_claimed", payload)
      sendMixPanelEvent("gift_claimed", payload)
    })
    bus.on("otc_deal_initiated", (payload: Dict) => {
      console.log("otc_deal_initiated", payload)
      sendMixPanelEvent("otc_deal_initiated", payload)
    })
    bus.on("swap_initiated", (payload: Dict) => {
      console.log("swap_initiated", payload)
      sendMixPanelEvent("swap_initiated", payload)
    })
    bus.on("swap_confirmed", (payload: Dict) => {
      console.log("swap_confirmed", payload)
      sendMixPanelEvent("swap_confirmed", payload)
    })
    bus.on("otc_confirmed", (payload: Dict) => {
      console.log("otc_confirmed", payload)
      sendMixPanelEvent("otc_confirmed", payload)
    })
    bus.on("withdrawal_initiated", (payload: Dict) => {
      console.log("withdrawal_initiated", payload)
      sendMixPanelEvent("withdrawal_initiated", payload)
    })
    bus.on("withdrawal_confirmed", (payload: Dict) => {
      console.log("withdrawal_confirmed", payload)
      sendMixPanelEvent("withdrawal_confirmed", payload)
    })
  }, [mixPanel])

  return mixPanel
}
