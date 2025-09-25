import { useSearchParams } from "next/navigation"

export function useIsFlatTokenListEnabled() {
  const searchParams = useSearchParams()
  return !!searchParams.get("flatTokenList")
}
