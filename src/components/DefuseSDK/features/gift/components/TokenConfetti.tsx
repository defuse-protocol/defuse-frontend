import confetti from "canvas-confetti"
import { useCallback, useEffect, useRef } from "react"

type TokenConfettiProps = {
  trigger?: boolean
}

export function useTokenConfetti() {
  const confettiFired = useRef(false)

  const fireConfetti = useCallback(() => {
    const duration = 3000
    const end = Date.now() + duration

    const colors = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#fbbf24"]

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0 },
        colors,
        gravity: 1.2,
        scalar: 1.2,
        drift: 0,
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0 },
        colors,
        gravity: 1.2,
        scalar: 1.2,
        drift: 0,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.3 },
        colors,
        gravity: 0.8,
        scalar: 1.5,
      })
    }, 300)
  }, [])

  const fireOnce = useCallback(() => {
    if (confettiFired.current) return
    confettiFired.current = true
    fireConfetti()
  }, [fireConfetti])

  return { fireConfetti, fireOnce }
}

export function TokenConfetti({ trigger = true }: TokenConfettiProps) {
  const { fireOnce } = useTokenConfetti()

  useEffect(() => {
    if (trigger) {
      fireOnce()
    }
  }, [trigger, fireOnce])

  return null
}
