"use client"

import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useRouter } from "next/navigation"
import { type ReactNode, useEffect } from "react"

/**
 * Redirects authenticated users to the account page.
 * Use on public pages like the landing page to redirect signed-in users.
 */
export function SignedInRedirect({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { state, isLoading } = useConnectWallet()

  useEffect(() => {
    // Wait for wallet connection state to be determined
    if (isLoading) return

    // If signed in, redirect to account page
    if (state.address) {
      router.replace("/account")
    }
  }, [state.address, isLoading, router])

  return <>{children}</>
}
