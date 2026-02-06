"use client"

import Button from "@src/components/Button"
import { useCallback, useEffect, useRef, useState } from "react"

const WAVE_PATTERN_SVG = `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%23f5f5f5' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`

type GiftRevealCardProps = {
  onReveal?: () => void
  children: React.ReactNode
}

export function GiftRevealCard({ onReveal, children }: GiftRevealCardProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleReveal = useCallback(() => {
    if (isAnimating || isRevealed) return

    setIsAnimating(true)

    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setIsRevealed(true)
      onReveal?.()
    }, 600)
  }, [isAnimating, isRevealed, onReveal])

  if (isRevealed) {
    return children
  }

  return (
    <div className="relative overflow-hidden bg-gray-800 rounded-3xl mt-16">
      <div className="absolute size-64 -bottom-32 rounded-full bg-brand/80 left-1/2 -translate-x-1/2 translate-y-1/4 blur-[100px]" />

      <div
        className="relative flex flex-col items-center justify-center py-16"
        style={{ backgroundImage: WAVE_PATTERN_SVG }}
      >
        <h1 className="text-3xl/8 font-bold text-white tracking-tight">
          You've received a gift!
        </h1>

        <Button
          className="mt-10"
          type="button"
          onClick={handleReveal}
          size="xl"
          variant="secondary"
        >
          Tap to reveal
        </Button>
      </div>
    </div>
  )
}
