import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

export function useIs1CsEnabled() {
  const searchParams = useSearchParams()
  return useMemo(() => !searchParams.has("not1cs"), [searchParams])
}
