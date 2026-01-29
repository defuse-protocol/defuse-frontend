"use client"

import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useRouter } from "next/navigation"
import { type ReactNode, useEffect } from "react"

/**
 * Redirects unauthenticated users to the landing page.
 * Wrap dashboard routes with this component to protect them.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { state, isLoading } = useConnectWallet()

  useEffect(() => {
    // Wait for wallet connection state to be determined
    if (isLoading) return

    // If not signed in, redirect to landing page
    if (!state.address) {
      router.replace("/")
    }
  }, [state.address, isLoading, router])

  // Show nothing while loading or redirecting
  if (isLoading || !state.address) {
    return null
  }

  return <>{children}</>
}
