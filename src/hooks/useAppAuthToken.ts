import { removeAppAuthToken } from "@src/utils/jwt"
import { logger } from "@src/utils/logger"
import { useEffect, useRef } from "react"
import type { ChainType } from "./useConnectWallet"

const TOKEN_STORAGE_KEY = "defuse_auth_token"

/**
 * Hook that automatically manages app auth token based on wallet connection state.
 * Generates token when wallet is connected, removes token when wallet is disconnected.
 * Similar to how useVerifiedWalletsStore works reactively.
 */
export function useAppAuthToken(
  address: string | undefined,
  chainType: ChainType | undefined
): void {
  const previousAddressRef = useRef<string | undefined>(undefined)
  const previousChainTypeRef = useRef<ChainType | undefined>(undefined)
  const isGeneratingRef = useRef(false)

  useEffect(() => {
    const hadWallet =
      previousAddressRef.current != null && previousChainTypeRef.current != null
    const hasWallet = address != null && chainType != null

    // Wallet disconnected: remove token
    if (hadWallet && !hasWallet) {
      removeAppAuthToken()
      previousAddressRef.current = undefined
      previousChainTypeRef.current = undefined
      isGeneratingRef.current = false
      return
    }

    // Wallet connected or changed: generate new token via API
    if (hasWallet) {
      const addressChanged =
        previousAddressRef.current !== address ||
        previousChainTypeRef.current !== chainType

      if (addressChanged && !isGeneratingRef.current) {
        isGeneratingRef.current = true
        fetch("/api/auth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authIdentifier: address,
            authMethod: chainType,
          }),
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error("Failed to generate token")
            }
            const data = (await response.json()) as { token: string }
            // Store token in localStorage
            if (typeof window !== "undefined") {
              localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
            }
            previousAddressRef.current = address
            previousChainTypeRef.current = chainType
            isGeneratingRef.current = false
          })
          .catch((error) => {
            logger.error("Failed to generate app auth token", { error })
            isGeneratingRef.current = false
          })
      }
    }
  }, [address, chainType])
}
