import type {
  BaseTokenInfo,
  TokenInfo,
} from "@src/components/DefuseSDK/types/base"
import { LIST_TOKENS, LIST_TOKENS_FLATTEN } from "@src/constants/tokens"
import { isBaseToken, isUnifiedToken } from "./token"

const SEPARATOR = ":"

/**
 * Parses a token identifier from URL (e.g. "USDC" or "USDC:solana").
 * Returns the matching base token or null.
 */
export function parseTokenFromUrl(
  symbolWithOptionalChain: string | null | undefined
): BaseTokenInfo | null {
  if (!symbolWithOptionalChain?.trim()) return null

  const [symbol, chainName] = symbolWithOptionalChain
    .trim()
    .split(SEPARATOR) as [string, string | undefined]

  if (chainName === undefined) {
    const found = LIST_TOKENS.find((t) => t.symbol === symbol)
    if (found == null) return null
    return isBaseToken(found) ? found : (found.groupedTokens?.[0] ?? null)
  }

  return (
    LIST_TOKENS_FLATTEN.find(
      (t) => t.symbol === symbol && t.originChainName === chainName
    ) ?? null
  )
}

/**
 * Finds the TokenInfo in tokenList that represents the given base token
 * (either the base itself or a grouped token containing it).
 */
export function findTokenInListByBase(
  baseToken: BaseTokenInfo,
  tokenList: TokenInfo[]
): TokenInfo | null {
  return (
    tokenList.find((t) => {
      if (isBaseToken(t)) return t.defuseAssetId === baseToken.defuseAssetId
      return t.groupedTokens?.some(
        (bt) => bt.defuseAssetId === baseToken.defuseAssetId
      )
    }) ?? null
  )
}

/**
 * Returns true when the token list has other tokens with the same symbol
 * on different chains (so we should include chain in URL).
 */
export function hasChainIcon(
  token: TokenInfo,
  tokens: TokenInfo[]
): token is BaseTokenInfo {
  return isUnifiedToken(token)
    ? false
    : tokens.filter(
        (t) =>
          (isBaseToken(t) ? token.defuseAssetId !== t.defuseAssetId : false) &&
          t.symbol === token.symbol
      ).length > 0
}

function tokenToSymbolWithChainName(token: BaseTokenInfo): string {
  return `${token.symbol}${SEPARATOR}${token.originChainName}`
}

/**
 * Serializes token for URL (e.g. "USDC" or "USDC:solana" when disambiguation needed).
 */
export function getTokenUrlSymbol(
  token: TokenInfo,
  tokens: TokenInfo[]
): string {
  return hasChainIcon(token, tokens)
    ? tokenToSymbolWithChainName(token)
    : token.symbol
}
