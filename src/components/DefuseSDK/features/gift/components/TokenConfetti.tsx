import confetti from "canvas-confetti"
import { useCallback, useEffect, useRef } from "react"

type TokenConfettiProps = {
  trigger?: boolean
}

const CONFETTI_COLORS = ["#ef4444", "#facc15", "#22c55e", "#06b6d4", "#d946ef"]
const CONFETTI_DURATION_MS = 1000

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
    confettiFired.current = false
  }, [])

  const fireConfetti = useCallback(() => {
    stopAnimation()

    const end = Date.now() + CONFETTI_DURATION_MS

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 45,
        spread: 90,
        origin: { x: 0, y: 1 },
        colors: CONFETTI_COLORS,
        gravity: 1,
        scalar: 1.2,
        drift: 0.5,
      })
      confetti({
        particleCount: 4,
        angle: 135,
        spread: 90,
        origin: { x: 1, y: 1 },
        colors: CONFETTI_COLORS,
        gravity: 1,
        scalar: 1.2,
        drift: -0.5,
      })

      if (Date.now() < end) {
        animationRef.current = requestAnimationFrame(frame)
      } else {
        animationRef.current = null
      }
    }
    frame()
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
