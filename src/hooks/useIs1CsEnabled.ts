import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

export function useIs1CsEnabled() {
  const searchParams = useSearchParams()

  return useMemo(() => {
    if (searchParams.get("not1cs")) {
      return false
    }
    return true
  }, [searchParams])
}
