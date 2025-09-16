import type {
  BaseTokenInfo,
  TokenAbstractId,
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
  const map = new Map<TokenAbstractId, TokenFamily>()

  for (const t of list) {
    const aid = getTokenAid(t)
    if (aid == null) {
      continue
    }

    let tokens: BaseTokenInfo[]

    if (isBaseToken(t)) {
      tokens = [t]
    } else {
      tokens = t.groupedTokens
    }

    for (const tt of tokens) {
      const did = getTokenDid(tt)
      if (!map.has(aid)) {
        map.set(aid, { aid, deployments: [did] })
      } else {
        // biome-ignore lint/style/noNonNullAssertion: item exists, we checked for null above
        map.get(aid)!.deployments.push(did)
      }
    }
  }

  return Array.from(map.values())
}
