import { type authHandle, authIdentity } from "@defuse-protocol/internal-utils"
import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@src/components/DefuseSDK/types/base"

const WHITELISTED_FEE_FREE_USERS = [
  "0xb60d0c2e8309518373b40f8eaa2cad0d1de3decb",
  "0xbb318a1ab8e46dfd93b3b0bca3d0ebf7d00187b9",
  "0x68b613148f7701e109e3c10ee6a7e88372fd85f8",
  "0x36ba155a8e9c45c0af262f9e61fff0d591472fe5",
  "EkFMoqYS5M5ZmGu7wKw2Un8D5QD9GgHPaYMixJBj9y66",
  "J3bzjaY5W7NabK4NzYsXU6ik66CeSMJQc5HCKw7WMq85",
  "GQY7cRqMp1Fs7Rq757BPM3G64ck4ngnXgdHpsTarsUg6",
]

export function computeAppFeeBps(
  defaultAppFeeBps: number,
  token1: BaseTokenInfo | UnifiedTokenInfo,
  token2: BaseTokenInfo | UnifiedTokenInfo,
  appFeeRecipient: string,
  currentUser: null | authHandle.AuthHandle
) {
  const userIsFeeRecipient =
    currentUser != null &&
    (authIdentity.authHandleToIntentsUserId(currentUser) === appFeeRecipient ||
      WHITELISTED_FEE_FREE_USERS.some(
        (w) => w.toLowerCase() === currentUser.identifier.toLowerCase()
      ))

  const isStablecoinSwap =
    hasTags(token1) &&
    hasTags(token2) &&
    token1.tags.includes("type:stablecoin") &&
    token2.tags.includes("type:stablecoin")

  if (userIsFeeRecipient || isStablecoinSwap) {
    return 0
  }

  return defaultAppFeeBps
}

function hasTags(a: object): a is { tags: string[] } {
  if ("tags" in a) {
    return true
  }
  return false
}
