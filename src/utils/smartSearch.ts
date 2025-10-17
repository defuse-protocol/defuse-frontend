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
  searchData: {
    symbolLower?: string
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
  if (symbolLower === query || nameLower === query) {
    return SEARCH_SCORES.EXACT_MATCH
  }

  // Case-insensitive exact match
  if (symbolLower === queryLower || nameLower === queryLower) {
    return SEARCH_SCORES.CASE_INSENSITIVE_EXACT
  }

  // Starts with query
  if (symbolLower?.startsWith(queryLower) || nameLower.startsWith(queryLower)) {
    return SEARCH_SCORES.STARTS_WITH
  }

  // Contains query
  if (symbolLower?.includes(queryLower) || nameLower.includes(queryLower)) {
    return SEARCH_SCORES.CONTAINS
  }

  // Fuzzy match (Levenshtein distance) - only for very close matches
  const symbolDistance = symbolLower
    ? levenshteinDistance(symbolLower, queryLower)
    : Number.POSITIVE_INFINITY
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
): { results: T[]; isComputing: boolean } {
  if (!query.trim()) {
    return { results: items, isComputing: false }
  }

  const { maxFuzzyDistance = 1, maxResults = 100 } = options

  // Calculate scores for all items and filter out non-matches using a single loop
  const scoredItems: Array<{ item: T; score: number }> = []

  // For large datasets, limit the number of items we process
  const maxItemsToProcess = Math.min(items.length, 10000) // Process max 10k items

  for (let i = 0; i < maxItemsToProcess; i++) {
    const item = items[i]
    const score = calculateSearchScore(item, query, maxFuzzyDistance)

    if (score > 0) {
      scoredItems.push({ item, score })

      // Early exit if we have enough high-quality results
      if (scoredItems.length >= maxResults * 2) {
        break
      }
    }
  }
  const result = scoredItems
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)

  // Apply max results limit
  return { results: result.slice(0, maxResults), isComputing: false }
}

export function createSearchData<T extends { symbol?: string; name: string }>(
  item: T
) {
  return {
    symbolLower: item.symbol?.toLowerCase(),
    nameLower: item.name.toLowerCase(),
  }
}
