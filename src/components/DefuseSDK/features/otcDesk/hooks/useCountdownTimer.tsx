import { formatDistanceToNowStrict, isPast } from "date-fns"
import { useCallback, useEffect, useRef, useState } from "react"

export function useCountdownTimer({ deadline }: { deadline: number | string }) {
  const [timeLeft, setTimeLeft] = useState("")
  const deadlineDate = useRef(new Date(deadline))

  const calculateTimeLeft = useCallback(() => {
    const expired = isPast(deadlineDate.current)

    if (expired) {
      setTimeLeft("Deal expired")
      return
    }

    const formatted = formatDistanceToNowStrict(deadlineDate.current)

    setTimeLeft(`Expires in ${formatted}`)
  }, [])

  useEffect(() => {
    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [calculateTimeLeft])

  return timeLeft
}
