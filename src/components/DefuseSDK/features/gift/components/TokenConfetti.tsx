import confetti from "canvas-confetti"
import { useCallback, useEffect, useRef } from "react"

type TokenConfettiProps = {
  trigger?: boolean
}

const CONFETTI_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#fbbf24"]
const CONFETTI_DURATION_MS = 3000

export function useTokenConfetti() {
  const confettiFired = useRef(false)
  const animationRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopAnimation = useCallback(() => {
    if (animationRef.current != null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const fireConfetti = useCallback(() => {
    stopAnimation()

    const end = Date.now() + CONFETTI_DURATION_MS

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0 },
        colors: CONFETTI_COLORS,
        gravity: 1.2,
        scalar: 1.2,
        drift: 0,
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0 },
        colors: CONFETTI_COLORS,
        gravity: 1.2,
        scalar: 1.2,
        drift: 0,
      })

      if (Date.now() < end) {
        animationRef.current = requestAnimationFrame(frame)
      } else {
        animationRef.current = null
      }
    }
    frame()

    timeoutRef.current = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.3 },
        colors: CONFETTI_COLORS,
        gravity: 0.8,
        scalar: 1.5,
      })
      timeoutRef.current = null
    }, 300)
  }, [stopAnimation])

  const fireOnce = useCallback(() => {
    if (confettiFired.current) return
    confettiFired.current = true
    fireConfetti()
  }, [fireConfetti])

  return { fireConfetti, fireOnce, stopAnimation }
}

export function TokenConfetti({ trigger = true }: TokenConfettiProps) {
  const { fireOnce, stopAnimation } = useTokenConfetti()

  useEffect(() => {
    if (trigger) {
      fireOnce()
    }
    return stopAnimation
  }, [trigger, fireOnce, stopAnimation])

  return null
}
