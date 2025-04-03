import { usePathname } from "next/navigation"
import { useMemo } from "react"

export function useIsActiveLink() {
  const pathname = usePathname()

  const isActive = useMemo(() => {
    return (href: string, exact = true) => {
      if (exact) {
        return pathname === href
      }
      return pathname.startsWith(href)
    }
  }, [pathname])

  return { isActive }
}
