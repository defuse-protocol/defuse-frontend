import { useCallback, useEffect, useRef, useState } from "react"

export function useCountdownTimer({ deadline }: { deadline: number | string }) {
  const [timeLeft, setTimeLeft] = useState("")
  const deadlineDate = useRef(new Date(deadline))

  const calculateTimeLeft = useCallback(() => {
    const now = new Date()
    const diff = deadlineDate.current.getTime() - now.getTime()

    if (diff <= 0) {
      setTimeLeft("Expired")
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (hours > 0) {
      setTimeLeft(`${hours}h ${minutes}m`)
    } else if (minutes > 0) {
      setTimeLeft(`${minutes}m ${seconds}s`)
    } else {
      setTimeLeft(`${seconds}s`)
    }
  }, [])

  useEffect(() => {
    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [calculateTimeLeft])

  return timeLeft
}
