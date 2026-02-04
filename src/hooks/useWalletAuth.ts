import { validateTokenForWallet } from "@src/actions/auth"
import { useQuery } from "@tanstack/react-query"

export interface UseWalletAuthResult {
  isAuthorized: boolean
  isSessionExpired: boolean
  isValidating: boolean
}

/**
 * Hook that manages wallet authentication state via server-side JWT validation.
 * The JWT is stored in an httpOnly cookie and validated server-side.
 */
export function useWalletAuth(
  address: string | undefined,
  chainType: string | undefined
): UseWalletAuthResult {
  const tokenValidation = useQuery({
    queryKey: ["token_validation", address, chainType],
    queryFn: async () => {
      if (!address || !chainType) {
        return { valid: false }
      }

      // Server-side validation reads from httpOnly cookie
      return validateTokenForWallet(address, chainType)
    },
    enabled: address != null && chainType != null,
    staleTime: 30_000,
    retry: false,
  })

  const isAuthorized = tokenValidation.data?.valid === true
  const isValidating = tokenValidation.isPending

  const isSessionExpired =
    tokenValidation.data?.valid === false &&
    tokenValidation.data?.reason !== undefined &&
    tokenValidation.data?.reason !== "no_token"

  return {
    isAuthorized,
    isSessionExpired,
    isValidating,
  }
}
