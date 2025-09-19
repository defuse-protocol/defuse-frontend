import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenDeploymentId,
  TokenInfo,
} from "../types/base"
import { isBaseToken, isNativeToken, isUnifiedToken } from "./token"

/**
 * Maps a token to its deployment identifier.
 */
export function getTokenDid(t: BaseTokenInfo): TokenDeploymentId {
  return [t.chainName, isNativeToken(t) ? "native" : t.address]
}

function tokenDidEquals(a: TokenDeploymentId, b: TokenDeploymentId): boolean {
  return a[0] === b[0] && a[1] === b[1]
}

/**
 * Extracts the chain name from a token deployment identifier.
 */
export function getChainFromDid(
  tokenDid: TokenDeploymentId
): SupportedChainName {
  return tokenDid[0]
}

/**
 * Returns the first token that matches the given deployment identifier.
 */
export function resolveTokenByDid(
  tokenList: TokenInfo[],
  tokenDid: TokenDeploymentId
): BaseTokenInfo | null {
  for (const t of tokenList) {
    if (isBaseToken(t) && tokenDidEquals(getTokenDid(t), tokenDid)) {
      return t
    }

    if (isUnifiedToken(t)) {
      const result = resolveTokenByDid(t.groupedTokens, tokenDid)
      if (result != null) {
        return result
      }
    }
  }
  return null
}
