"use client"

import { MIXPANEL_TOKEN } from "@src/utils/environment"
import { APP_ENV } from "@src/utils/environment"
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

  useEffect(() => {
    if (!MIXPANEL_TOKEN) {
      // biome-ignore lint/suspicious/noConsole: <explanation>
      console.warn("Mixpanel token is not configured")
      return
    }

    try {
      mixpanel.init(MIXPANEL_TOKEN, {
        debug: APP_ENV === "development",
        track_pageview: false,
        persistence: "localStorage",
      })
      setMixpanelInstance(mixpanel)
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: <explanation>
      console.error("Failed to initialize Mixpanel:", error)
    }
  }, [])

  return (
    <MixpanelContext.Provider value={mixpanelInstance}>
      {children}
    </MixpanelContext.Provider>
  )
}

export function useMixpanel() {
  const mixpanel = useContext(MixpanelContext)

  // Return null if mixpanel is not initialized (no token, init failed, or still loading)
  if (!mixpanel) return null

  return mixpanel
}
