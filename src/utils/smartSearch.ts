import type { TokenInfo } from "@src/components/DefuseSDK/types/base"

// Scoring system for search relevance
export const SEARCH_SCORES = {
  EXACT_MATCH: 100,
  CASE_INSENSITIVE_EXACT: 90,
  STARTS_WITH: 80,
  CONTAINS: 70,
  FUZZY_MATCH: 50,
} as const

// Levenshtein distance for fuzzy matching
export function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[a.length][b.length]
}

export interface SearchableItem {
  token: TokenInfo
  searchData?: {
    symbolLower: string
    nameLower: string
  }
}

// Calculate search score for a searchable item
export function calculateSearchScore(
  item: SearchableItem,
  query: string,
  maxFuzzyDistance = 1 // Reduced from 2 to 1 for more precise matching
): number {
  if (!item.searchData) return 0

  const { symbolLower, nameLower } = item.searchData
  const queryLower = query.toLowerCase()

  // Exact match (case-sensitive)
  if (item.token.symbol === query || item.token.name === query) {
    return SEARCH_SCORES.EXACT_MATCH
  }

  // Case-insensitive exact match
  if (symbolLower === queryLower || nameLower === queryLower) {
    return SEARCH_SCORES.CASE_INSENSITIVE_EXACT
  }

  // Starts with query
  if (symbolLower.startsWith(queryLower) || nameLower.startsWith(queryLower)) {
    return SEARCH_SCORES.STARTS_WITH
  }

  // Contains query
  if (symbolLower.includes(queryLower) || nameLower.includes(queryLower)) {
    return SEARCH_SCORES.CONTAINS
  }

  // Fuzzy match (Levenshtein distance) - only for very close matches
  const symbolDistance = levenshteinDistance(symbolLower, queryLower)
  const nameDistance = levenshteinDistance(nameLower, queryLower)
  const minDistance = Math.min(symbolDistance, nameDistance)

  // Additional check: only allow fuzzy matching if the query is at least 3 characters
  // and the distance is very small relative to the query length
  if (
    queryLower.length >= 3 &&
    minDistance <= maxFuzzyDistance &&
    minDistance <= Math.floor(queryLower.length / 2) // Distance should be at most half the query length
  ) {
    return SEARCH_SCORES.FUZZY_MATCH - minDistance
  }

  return 0
}

export function performSearch<T extends SearchableItem>(
  items: T[],
  query: string,
  options: {
    maxFuzzyDistance?: number
    maxResults?: number
  } = {}
): T[] {
  if (!query.trim()) {
    return items
  }

  const { maxFuzzyDistance = 1, maxResults } = options

  // Calculate scores for all items and filter out non-matches
  const scoredItems = items
    .map((item) => ({
      item,
      score: calculateSearchScore(item, query, maxFuzzyDistance),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .map(({ item }) => item)

  // Apply max results limit if specified
  return maxResults ? scoredItems.slice(0, maxResults) : scoredItems
}

export function createSearchData(token: TokenInfo) {
  return {
    symbolLower: token.symbol.toLowerCase(),
    nameLower: token.name.toLowerCase(),
  }
}
