import type {
  BaseTokenInfo,
  TokenAbstractId,
  TokenFamily,
  TokenInfo,
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
  t: TokenInfo
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
export function extractTokenFamilyList(list: TokenInfo[]): TokenFamily[] {
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
      const family = map.get(aid)
      if (family) {
        family.deployments.push(did)
      } else {
        map.set(aid, { aid, deployments: [did] })
      }
    }
  }

  return Array.from(map.values())
}
