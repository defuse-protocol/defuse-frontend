"use client"

import { useEffect } from "react"

import { initSDK } from "@src/libs/defuse-sdk/initSDK"

export function InitDefuseSDK() {
  useEffect(() => {
    initSDK()
  }, [])

  return null
}
