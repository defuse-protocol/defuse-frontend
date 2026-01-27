import { setActiveWalletToken, validateTokenForWallet } from "@src/actions/auth"
import { useVerifiedWalletsStore } from "@src/stores/useVerifiedWalletsStore"
import { useWalletTokensStore } from "@src/stores/useWalletTokensStore"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect } from "react"

export interface UseWalletAuthResult {
  isVerified: boolean
  isSessionExpired: boolean
}

/**
 * Hook that manages wallet authentication state including token validation
 * and cookie synchronization. Determines if a wallet is verified based on:
 * - Legacy verified wallets store
 * - Valid JWT token (with server-side validation)
 * - Optimistic verification during token validation
 */
export function useWalletAuth(
  address: string | undefined,
  chainType: string | undefined
): UseWalletAuthResult {
  const isVerifiedFromStore = useVerifiedWalletsStore(
    useCallback(
      (store) =>
        address != null ? store.walletAddresses.includes(address) : false,
      [address]
    )
  )

  const storedToken = useWalletTokensStore(
    useCallback(
      (store) => (address != null ? store.getToken(address) : null),
      [address]
    )
  )

  const hasHydrated = useWalletTokensStore((store) => store._hasHydrated)

  const tokenValidation = useQuery({
    queryKey: ["token_validation", address, chainType, storedToken],
    queryFn: async () => {
      if (!address || !chainType || !storedToken) {
        return { valid: false }
      }

      const result = await validateTokenForWallet(
        storedToken,
        address,
        chainType
      )

      if (!result.valid) {
        useWalletTokensStore.getState().removeToken(address)
      }

      return result
    },
    enabled:
      hasHydrated &&
      address != null &&
      chainType != null &&
      storedToken != null,
    staleTime: 30_000,
    retry: false,
  })

  const isTokenValidating =
    !hasHydrated || (storedToken != null && tokenValidation.isPending)

  const isVerified =
    isVerifiedFromStore ||
    tokenValidation.data?.valid === true ||
    (isTokenValidating && storedToken != null)

  const isSessionExpired =
    tokenValidation.data?.valid === false &&
    tokenValidation.data?.reason !== undefined

  useEffect(() => {
    if (address && storedToken) {
      void setActiveWalletToken(storedToken)
    }
  }, [address, storedToken])

  return {
    isVerified,
    isSessionExpired,
  }
}
