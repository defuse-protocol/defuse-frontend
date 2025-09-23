import type { Intent } from "@defuse-protocol/contract-types"
import type { SupportedChainName } from "../types/base"

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
