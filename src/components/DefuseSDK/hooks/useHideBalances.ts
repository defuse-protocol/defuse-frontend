import { useState } from "react"

const STORAGE_KEY = "defuse:hideBalances"

export function useHideBalances() {
  const [hidden, setHidden] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "true"
  )

  const toggle = () => {
    setHidden((prev) => {
      localStorage.setItem(STORAGE_KEY, String(!prev))
      return !prev
    })
  }

  return { hidden, toggle }
}

export type HideBalancesConfig = ReturnType<typeof useHideBalances>
