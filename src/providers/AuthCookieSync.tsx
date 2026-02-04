"use client"

import { setActiveWalletToken } from "@src/actions/auth"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useWalletTokensStore } from "@src/stores/useWalletTokensStore"
import { logger } from "@src/utils/logger"
import { useEffect, useRef } from "react"

/**
 * Syncs the active wallet's JWT to the httpOnly cookie in a single place.
 * Prevents duplicate server action calls (and POST request loops) that occurred
 * when every useConnectWallet → useWalletAuth instance ran the sync effect.
 *
 * Security: Only tokens from useWalletTokensStore are synced; that store is
 * populated solely with JWTs issued by the server after verification
 * (generateAuthTokenFromWalletSignature). The cookie is still validated
 * server-side (jwtVerify) on use. No new attack surface vs previous sync in useWalletAuth.
 */
export function AuthCookieSync() {
  const { state } = useConnectWallet()
  const storedToken = useWalletTokensStore((store) =>
    state.address != null ? store.getToken(state.address) : null
  )
  const lastSynced = useRef<{ address: string; token: string } | null>(null)

  useEffect(() => {
    if (!state.address || !storedToken) {
      return
    }
    // Avoid redundant calls when address+token haven't changed
    if (
      lastSynced.current?.address === state.address &&
      lastSynced.current?.token === storedToken
    ) {
      return
    }
    lastSynced.current = { address: state.address, token: storedToken }

    void (async () => {
      try {
        await setActiveWalletToken(storedToken)
      } catch (error) {
        logger.error("Auth cookie sync failed", { error })
      }
    })()
  }, [state.address, storedToken])

  return null
}
