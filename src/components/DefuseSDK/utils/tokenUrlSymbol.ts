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
 * Finds a token by symbol in the provided token list.
 * Uses the same approach as swap page's useDeterminePair.
 * For symbol-only input (no chain), prefers unified tokens.
 * For symbol:chain input, finds the specific base token.
 */
export function findTokenBySymbol(
  input: string | null | undefined,
  tokens: TokenInfo[]
): TokenInfo | null {
  if (!input?.trim()) return null

  const trimmedInput = input.trim()

  // If input contains chain separator, find specific base token
  if (trimmedInput.includes(SEPARATOR)) {
    const [symbol, chainName] = trimmedInput.split(SEPARATOR) as [
      string,
      string | undefined,
    ]
    const baseToken = LIST_TOKENS_FLATTEN.find(
      (t) => t.symbol === symbol && t.originChainName === chainName
    )
    if (!baseToken) return null
    // Return the TokenInfo from the list that contains this base token
    return findTokenInListByBase(baseToken, tokens)
  }

  // For symbol-only, explicitly prefer unified tokens over base tokens
  const symbolLower = trimmedInput.toLowerCase()

  // First, try to find a unified token in the provided tokens list
  const unifiedTokenInList = tokens.find(
    (token) =>
      !isBaseToken(token) &&
      (token.symbol.toLowerCase() === symbolLower ||
        token.groupedTokens?.some(
          (t: BaseTokenInfo) => t.symbol.toLowerCase() === symbolLower
        ))
  )

  if (unifiedTokenInList) {
    return unifiedTokenInList
  }

  // The provided tokens list might be flattened (no unified tokens).
  // Search in LIST_TOKENS which contains unified tokens.
  const unifiedTokenInListTokens = LIST_TOKENS.find(
    (token) =>
      !isBaseToken(token) &&
      (token.symbol.toLowerCase() === symbolLower ||
        token.groupedTokens?.some(
          (t: BaseTokenInfo) => t.symbol.toLowerCase() === symbolLower
        ))
  )

  if (unifiedTokenInListTokens) {
    return unifiedTokenInListTokens
  }

  // Fallback to base token if no unified token found anywhere
  return (
    tokens.find((token) => token.symbol.toLowerCase() === symbolLower) ?? null
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
