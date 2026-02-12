import { useEffect, useState } from "react"

const STORAGE_KEY = "defuse:hideBalances"

export function useHideBalances() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === "true")
  }, [])

  const toggle = () => {
    setHidden((prev) => {
      localStorage.setItem(STORAGE_KEY, String(!prev))
      return !prev
    })
  }

  return { hidden, toggle }
}
