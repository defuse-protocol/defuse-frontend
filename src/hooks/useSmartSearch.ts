import { type SearchableItem, performSearch } from "@src/utils/smartSearch"
import { useEffect, useState } from "react"

export function useSmartSearch<T extends SearchableItem>(
  items: T[],
  query: string,
  options: {
    maxFuzzyDistance?: number
    maxResults?: number
    debounceMs?: number
  } = {}
) {
  const [searchResults, setSearchResults] = useState<T[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isComputing, setIsComputing] = useState(false)

  const { debounceMs = 250, maxFuzzyDistance, maxResults } = options

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      setIsComputing(false)
      return
    }

    // Start debounce phase
    setIsSearching(true)
    setIsComputing(false)

    let isCancelled = false

    const debounceTimeout = setTimeout(() => {
      // Start computation phase
      if (isCancelled) return

      setIsSearching(false)
      setIsComputing(true)

      try {
        const { results } = performSearch(items, query, {
          maxFuzzyDistance,
          maxResults,
        })

        // Only update state if the effect hasn't been cancelled
        if (!isCancelled) {
          setSearchResults(results)
        }
      } catch {
        if (!isCancelled) {
          setSearchResults([])
        }
      } finally {
        if (!isCancelled) {
          setIsComputing(false)
        }
      }
    }, debounceMs)

    return () => {
      isCancelled = true
      clearTimeout(debounceTimeout)
    }
  }, [query, items, debounceMs, maxFuzzyDistance, maxResults])

  return {
    results: searchResults,
    isSearching,
    isComputing,
    isLoading: isSearching || isComputing,
  }
}
