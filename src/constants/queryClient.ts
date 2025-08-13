"use client"

import { experimental_createQueryPersister } from "@tanstack/query-persist-client-core"
import { QueryClient } from "@tanstack/react-query"

const persister = experimental_createQueryPersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2000 * 60,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - should match or exceed maxAge
      persister: persister.persisterFn,
    },
  },
})

export default queryClient
