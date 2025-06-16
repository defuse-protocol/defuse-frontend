"use client"

import { useEffect } from "react"

import { useMixpanelBus } from "@src/hooks/useMixpanelBus"
import { initSDK } from "@src/libs/defuse-sdk/initSDK"

export function InitDefuseSDK() {
  useMixpanelBus()

  useEffect(() => {
    initSDK()
  }, [])

  return null
}
