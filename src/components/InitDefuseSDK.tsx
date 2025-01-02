"use client"

import { initSDK } from "@src/libs/defuse-sdk/initSDK"
import { useEffect } from "react"

export function InitDefuseSDK() {
  useEffect(() => {
    initSDK()
  }, [])

  return null
}
