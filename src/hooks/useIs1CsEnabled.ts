import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { ONE_CLICK_SWAP_FRACTION } from "@src/utils/environment"
import { isFeatureEnabled } from "@src/utils/isFeatureEnabled"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

export function useIs1CsEnabled() {
  const { state } = useConnectWallet()
  const searchParams = useSearchParams()
  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType

  return useMemo(() => {
    if (searchParams.get("1cs")) {
      return true
    }

    if (searchParams.get("not1cs") || !userAddress || !userChainType) {
      return false
    }

    return isFeatureEnabled(
      `${userAddress}${userChainType}`,
      ONE_CLICK_SWAP_FRACTION
    )
  }, [searchParams, userAddress, userChainType])
}
