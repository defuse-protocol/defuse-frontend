"use client"

import { MIXPANEL_TOKEN } from "@src/utils/environment"
import mixpanel, { type Mixpanel } from "mixpanel-browser"
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

export const MixpanelContext = createContext<Mixpanel | null>(null)

export function MixpanelProvider({ children }: { children: ReactNode }) {
  const [mixpanelInstance, setMixpanelInstance] = useState<Mixpanel | null>(
    null
  )
  const token = MIXPANEL_TOKEN

  useEffect(() => {
    if (!token) {
      console.warn("Mixpanel token is not configured")
      return
    }

    try {
      mixpanel.init(token, {
        debug: process.env.NODE_ENV === "development",
        track_pageview: true,
        persistence: "localStorage",
      })
      setMixpanelInstance(mixpanel)
    } catch (error) {
      console.error("Failed to initialize Mixpanel:", error)
    }
  }, [token])

  return (
    <MixpanelContext.Provider value={mixpanelInstance}>
      {children}
    </MixpanelContext.Provider>
  )
}

export function useMixpanel() {
  const mixpanel = useContext(MixpanelContext)

  if (!mixpanel) {
    console.warn(
      "Mixpanel is not initialized. Make sure NEXT_PUBLIC_MIXPANEL_TOKEN is set in your environment variables."
    )
    return null
  }

  return mixpanel
}
