import { useEffect, useState } from "react"

/**
 * Sets a value after a delay
 */
export function useThrottledValue<T>(value: T, delayMs: number): T {
  const [throttledValue, setThrottledValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setThrottledValue(value)
    }, delayMs)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delayMs])

  return throttledValue
}
