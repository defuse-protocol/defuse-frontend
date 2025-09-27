import type {
  BaseTokenInfo,
  TokenAbstractId,
  TokenFamily,
  TokenInfo,
} from "../types/base"
import { getTokenAid, isBaseToken } from "./token"

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
      const family = map.get(aid)
      if (family) {
        family.tokenIds.push(tt.defuseAssetId)
      } else {
        map.set(aid, { aid, tokenIds: [tt.defuseAssetId] })
      }
    }
  }

  return Array.from(map.values())
}
