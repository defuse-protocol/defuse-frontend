import type { SupportedChainName } from "../types/base"
import type { Intent } from "../types/defuse-contracts-types"

export function buildHotOmniWithdrawIntent(_args: {
  chainName: SupportedChainName
  defuseAssetId: string
  amount: bigint
  receiver: string
}): Intent {
  // we don't care about this intent, it is not used in the current iteration and will be removed
  return {
    intent: "invalidate_nonces",
    nonces: [],
  }
}
