import { authIdentity } from "@defuse-protocol/internal-utils"
import { useWatchHoldings } from "@src/components/DefuseSDK/features/account/hooks/useWatchHoldings"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useMemo } from "react"

export function useEarnTokens() {
  const { state } = useConnectWallet()

  const earnTokens = useMemo(() => {
    return LIST_TOKENS.filter(
      (token) => "tags" in token && token.tags?.includes("category:earn-only")
    )
  }, [])

  const userId =
    state.isVerified && state.address && state.chainType
      ? authIdentity.authHandleToIntentsUserId(state.address, state.chainType)
      : null

  const { data: holdings } = useWatchHoldings({ userId, tokenList: earnTokens })

  return { earnTokens, holdings, isConnected: state.isVerified }
}
