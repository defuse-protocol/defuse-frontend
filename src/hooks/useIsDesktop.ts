import { useEffect, useState } from "react"

/**
 * Hook to detect if the current screen size is desktop (768px and above)
 * Uses the same breakpoint as Tailwind's `md:` prefix
 */
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    // SSR-safe: return false on server, actual value on client
    if (typeof window === "undefined") return false
    return window.innerWidth >= 768
  })

  useEffect(() => {
    const checkIsDesktop = () => {
      if (typeof window === "undefined") return
      setIsDesktop(window.innerWidth >= 768)
    }

    checkIsDesktop()

    window.addEventListener("resize", checkIsDesktop)
    return () => {
      window.removeEventListener("resize", checkIsDesktop)
    }
  }, [])

  return isDesktop
}
