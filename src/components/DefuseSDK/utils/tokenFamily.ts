import type {
  BaseTokenInfo,
  TokenFamily,
  UnifiedTokenInfo,
} from "../types/base"
import { getTokenAid, isBaseToken } from "./token"
import { getTokenDid } from "./tokenDeployment"

/**
 * For now, it is just an array. In the future, it could be a map or
 * another structure that allows for faster lookups.
 */
export type TokenFamilyList = TokenFamily[]

/**
 * Determines which token family a token belongs to.
 */
export function resolveTokenFamily(
  tokenFamilies: TokenFamilyList,
  t: BaseTokenInfo | UnifiedTokenInfo
): TokenFamily | null {
  const tokenAid = getTokenAid(t)
  if (tokenAid == null) {
    return null
  }

  return tokenFamilies.find((t) => t.aid === tokenAid) ?? null
}

/**
 * Extracts token families from a list of tokens.
 */
export function extractTokenFamilyList(
  list: (BaseTokenInfo | UnifiedTokenInfo)[]
): TokenFamily[] {
  return list
    .map((t) => {
      if (isBaseToken(t)) {
        return {
          aid: getTokenAid(t),
          deployments: [getTokenDid(t)],
        }
      }

      return {
        aid: getTokenAid(t),
        deployments: t.groupedTokens.map(getTokenDid),
      }
    })
    .filter((f): f is TokenFamily => f.aid != null)
}
