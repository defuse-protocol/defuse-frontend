import { useCallback, useEffect } from "react"

import { useMixpanel } from "@src/providers/MixpanelProvider"

export const useSignInLogger = (
  address: string | undefined,
  chainType: string | undefined,
  isVerified: boolean
) => {
  const mixPanel = useMixpanel()
  const storageKey = "signedInAddress"

  useEffect(() => {
    if (address != null && isVerified) {
      if (!localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, address)
        mixPanel?.track("wallet_connection_success", {
          wallet_type: chainType,
          wallet_address: address,
          timestamp: Date.now(),
        })
      }
    }
  }, [address, isVerified, chainType, mixPanel])

  return {
    onSignOut: useCallback(() => {
      localStorage.removeItem(storageKey)
    }, []),
  }
}
