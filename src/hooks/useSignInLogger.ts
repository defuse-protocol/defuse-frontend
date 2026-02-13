import { useCallback, useEffect } from "react"

import { useMixpanel } from "@src/providers/MixpanelProvider"
import { hashForAnalytics } from "@src/utils/analyticsSanitize"

export const useSignInLogger = (
  address: string | undefined,
  chainType: string | undefined,
  isAuthorized: boolean
) => {
  const mixPanel = useMixpanel()
  const storageKey = "signedInAddress"

  const sendMixPanelEvent = useCallback(
    async (eventName: string) => {
      const hashedAddress = await hashForAnalytics(address)
      mixPanel?.track(eventName, {
        wallet_type: chainType,
        chain: chainType,
        wallet_address_hash: hashedAddress,
        timestamp: Date.now(),
      })
    },
    [chainType, address, mixPanel]
  )

  useEffect(() => {
    if (address != null && isAuthorized) {
      try {
        if (!localStorage.getItem(storageKey)) {
          localStorage.setItem(storageKey, address)
          void sendMixPanelEvent("wallet_connection_success").catch(() => {})
        }
      } catch {
        // localStorage may be unavailable
      }
    }
  }, [address, isAuthorized, sendMixPanelEvent])

  return {
    onSignOut: useCallback(() => {
      try {
        localStorage.removeItem(storageKey)
      } catch {
        // localStorage may be unavailable
      }
    }, []),
  }
}
