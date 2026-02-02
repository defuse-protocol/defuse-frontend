import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { useMixpanel } from "@src/providers/MixpanelProvider"

export const usePathLogging = () => {
  const pathname = usePathname()
  const mixPanel = useMixpanel()

  useEffect(() => {
    const shouldBeLoggedPaths: Record<string, string> = {
      "/": "trade",
      "/account": "account",
      "/deposit": "deposit",
      "/gifts": "gifts",
      "/gifts/new": "gifts-new",
      "/gifts/view": "gifts-view",
      "/deals/new": "otc-create-order",
      "/otc/order": "otc-order",
      "/withdraw": "withdraw",
    }

    if (shouldBeLoggedPaths[pathname]) {
      mixPanel?.track("page_changed", {
        target_page: shouldBeLoggedPaths[pathname],
        referrer_page: document.referrer,
      })
    }
  }, [pathname, mixPanel])
}
