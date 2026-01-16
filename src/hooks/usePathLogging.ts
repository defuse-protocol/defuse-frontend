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
      "/gift-card/create-gift": "gift-card-create-gift",
      "/gift-card/view-gift": "gift-card-view-gift",
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
