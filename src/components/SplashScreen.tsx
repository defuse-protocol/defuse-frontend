"use client"

import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { NearIntentsLogoSymbolIcon } from "@src/icons"
import { usePathname, useRouter } from "next/navigation"
import { type ReactNode, useEffect, useState } from "react"

// To avoid a quick flicker of the splash screen
const MIN_SPLASH_DURATION_MS = 2000

const SplashScreen = ({ children }: { children: ReactNode }) => {
  const { state, isLoading } = useConnectWallet()
  const router = useRouter()
  const pathname = usePathname()
  const isOnLoginPage = pathname === "/login"
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true)
    }, MIN_SPLASH_DURATION_MS)
    return () => clearTimeout(timer)
  }, [])

  const showSplash = isLoading || !minTimeElapsed

  useEffect(() => {
    if (showSplash) return

    if (!state.address && !isOnLoginPage) {
      router.replace("/login")
    } else if (state.address && isOnLoginPage) {
      router.replace("/account")
    }
  }, [showSplash, state.address, isOnLoginPage, router])

  // return <SplashScreenContent />

  if (showSplash) {
    // Show splash screen
    return <SplashScreenContent />
  }

  if (isOnLoginPage && state.address) {
    // Redirect to account page
    return <SplashScreenContent />
  }

  if (isOnLoginPage && !state.address) {
    // Show login page
    return children
  }

  if (!state.address) {
    // Redirect to login page
    return <SplashScreenContent />
  }

  // Show dashboard
  return children
}

export default SplashScreen

const SplashScreenContent = () => (
  <div className="relative h-screen w-screen flex items-center justify-center overflow-hidden animate-in fade-in duration-300 ease-out">
    <h1 className="sr-only">Loading NEAR Intents application</h1>
    <NearIntentsLogoSymbolIcon className="size-18 shrink-0" />
  </div>
)
