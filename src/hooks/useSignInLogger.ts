import { useCallback, useEffect } from "react"

import { useMixpanel } from "@src/providers/MixpanelProvider"

export const useSignInLogger = (
  address: string | undefined,
  chainType: string | undefined,
  isVerified: boolean
) => {
  const mixPanel = useMixpanel()
  const storageKey = "signedInAddress"

  const sendMixPanelEvent = useCallback(
    (eventName: string) => {
      mixPanel?.track(eventName, {
        wallet_type: chainType,
        wallet_address: address,
        timestamp: Date.now(),
      })
    },
    [chainType, address, mixPanel]
  )

  useEffect(() => {
    if (address != null && isVerified) {
      if (!localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, address)
        sendMixPanelEvent("wallet_connection_success")
      }
    }
  }, [address, isVerified, sendMixPanelEvent])

  return {
    onSignOut: useCallback(() => {
      localStorage.removeItem(storageKey)
    }, []),
  }
}
