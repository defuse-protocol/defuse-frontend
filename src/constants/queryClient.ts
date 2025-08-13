"use client"

import { QueryClient } from "@tanstack/react-query"

export default new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2000 * 60,
    },
  },
})
