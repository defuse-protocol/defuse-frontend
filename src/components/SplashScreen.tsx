"use client"

import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { NearIntentsLogoSymbolIcon } from "@src/icons"
import { usePathname, useRouter } from "next/navigation"
import { type ReactNode, useEffect, useRef, useState } from "react"

// To avoid a quick flicker of the splash screen
const MIN_SPLASH_DURATION_MS = 2000

const SplashScreen = ({ children }: { children: ReactNode }) => {
  const { state, isLoading } = useConnectWallet()
  const router = useRouter()
  const pathname = usePathname()
  const isOnLoginPage = pathname === "/login"
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const initialLoadCompleteRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true)
    }, MIN_SPLASH_DURATION_MS)
    return () => clearTimeout(timer)
  }, [])

  // Latch: once loaded, never show splash again even if isLoading briefly flickers
  if (minTimeElapsed && !isLoading) {
    initialLoadCompleteRef.current = true
  }

  const showSplash =
    !initialLoadCompleteRef.current && (isLoading || !minTimeElapsed)

  useEffect(() => {
    if (showSplash) return

    if (!state.address && !isOnLoginPage) {
      router.replace("/login")
    } else if (state.address && isOnLoginPage) {
      router.replace("/account")
    }
  }, [showSplash, state.address, isOnLoginPage, router])

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
  <div className="relative h-screen w-screen flex flex-col items-center justify-center gap-6 overflow-hidden animate-in fade-in duration-300 ease-out">
    <h1 className="sr-only">Loading NEAR Intents application</h1>
    <NearIntentsLogoSymbolIcon className="size-18 shrink-0" />
    <ThreeDotsLoader />
  </div>
)

const ThreeDotsLoader = () => (
  <div className="flex gap-1.5">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="size-1.5 rounded-full bg-white/60 animate-dot-bounce"
        style={{ animationDelay: `${i * 160}ms` }}
      />
    ))}
  </div>
)
