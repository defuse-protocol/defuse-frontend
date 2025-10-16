import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface MagneticEffectOptions {
  magneticRadius?: number
  maxMove?: number
  transitionDuration?: number
}

interface MagneticTransform {
  x: number
  y: number
}

export function useMagneticEffect(options: MagneticEffectOptions = {}) {
  const {
    magneticRadius = 100,
    maxMove = 8,
    transitionDuration = 300,
  } = options

  const buttonRef = useRef<HTMLButtonElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    })
  }, [])

  useEffect(() => {
    const updateButtonRect = () => {
      if (buttonRef.current) {
        setButtonRect(buttonRef.current.getBoundingClientRect())
      }
    }

    updateButtonRect()
    window.addEventListener("resize", updateButtonRect)

    return () => {
      window.removeEventListener("resize", updateButtonRect)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [handleMouseMove])

  // Calculate magnetic effect with memoization and early exits
  const magneticTransform: MagneticTransform = useMemo(() => {
    if (!buttonRect) return { x: 0, y: 0 }

    const buttonCenterX = buttonRect.left + buttonRect.width / 2
    const buttonCenterY = buttonRect.top + buttonRect.height / 2

    // Early exit if mouse is too far away (outside magnetic radius)
    const deltaX = mousePosition.x - buttonCenterX
    const deltaY = mousePosition.y - buttonCenterY
    const distanceSquared = deltaX ** 2 + deltaY ** 2
    const magneticRadiusSquared = magneticRadius ** 2

    if (distanceSquared > magneticRadiusSquared) {
      return { x: 0, y: 0 }
    }

    const distance = Math.sqrt(distanceSquared)
    const strength = 1 - distance / magneticRadius

    const moveX = (deltaX / distance) * maxMove * strength
    const moveY = (deltaY / distance) * maxMove * strength

    return { x: moveX, y: moveY }
  }, [mousePosition.x, mousePosition.y, buttonRect, magneticRadius, maxMove])

  const buttonProps = {
    ref: buttonRef,
    style: {
      transform: `translate(${magneticTransform.x}px, ${magneticTransform.y}px)`,
    },
    className: `transition-transform duration-${transitionDuration} ease-out`,
  }

  return {
    buttonRef,
    magneticTransform,
    buttonProps,
  }
}
