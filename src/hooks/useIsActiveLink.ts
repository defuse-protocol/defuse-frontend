import { usePathname } from "next/navigation"

export function useIsActiveLink() {
  const pathname = usePathname()
  return {
    isActive: (href: string, exact = true) => {
      if (exact) {
        return pathname === href
      }
      return pathname.startsWith(href)
    },
  }
}
