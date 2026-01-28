"use client"

// TODO(test-cleanup): storageType prop and clearGiftRevealState are used by test page only. Production uses localStorage only. Remove when test page is removed.

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"

type GiftRevealCardProps = {
  giftId: string
  onReveal?: () => void
  children: React.ReactNode
  storageType?: "local" | "session"
}

export function GiftRevealCard({
  giftId,
  onReveal,
  children,
  storageType = "local",
}: GiftRevealCardProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const storageKey = `gift_revealed_${giftId}`
  const storage = storageType === "session" ? sessionStorage : localStorage

  useEffect(() => {
    const wasRevealed = storage.getItem(storageKey)
    if (wasRevealed === "true") {
      setIsRevealed(true)
    }
  }, [storageKey, storage])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isAnimating) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateXValue = ((y - centerY) / centerY) * -15
      const rotateYValue = ((x - centerX) / centerX) * 15

      setRotateX(rotateXValue)
      setRotateY(rotateYValue)
    },
    [isAnimating]
  )

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setRotateX(0)
    setRotateY(0)
  }, [])

  const handleReveal = useCallback(() => {
    if (isAnimating || isRevealed) return

    setIsAnimating(true)
    setRotateX(0)
    setRotateY(0)

    setTimeout(() => {
      setIsRevealed(true)
      storage.setItem(storageKey, "true")
      onReveal?.()
    }, 600)
  }, [isAnimating, isRevealed, storageKey, onReveal, storage])

  if (isRevealed) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 w-full">
      <button
        type="button"
        onClick={handleReveal}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        disabled={isAnimating}
        className="relative w-[320px] md:w-[444px] aspect-[1.6/1] cursor-pointer bg-transparent border-none p-0"
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl transition-all duration-200 ease-out"
          style={{
            transform: isAnimating
              ? "rotateY(180deg) scale(0.9)"
              : `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.02 : 1})`,
            transformStyle: "preserve-3d",
            opacity: isAnimating ? 0 : 1,
            transition: isAnimating
              ? "transform 0.6s ease-out, opacity 0.5s ease-out"
              : "transform 0.2s ease-out",
          }}
        >
          <Image
            src="/static/images/gift-blank-card.png"
            alt="Gift card"
            fill
            className="object-cover"
            priority
          />

          <div
            className="absolute inset-0 flex flex-col items-center justify-center pt-6 bg-black/10"
            style={{ transform: "translateZ(20px)" }}
          >
            <img
              src="/static/icons/network/near.svg"
              alt="NEAR"
              className="size-5 mb-2"
            />
            <h2
              className="text-white text-xl md:text-2xl font-black tracking-wide drop-shadow-lg"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}
            >
              YOU RECEIVED A GIFT!
            </h2>
            <span className="mt-3 px-4 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              Tap to reveal
            </span>
          </div>

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.2) 55%, transparent 60%)",
              opacity: isHovered ? 1 : 0,
              transform: `translateX(${isHovered ? "100%" : "-100%"})`,
              transition: "transform 0.6s ease-out, opacity 0.3s ease-out",
            }}
          />
        </div>

        <div
          className="absolute -bottom-4 left-1/2 w-4/5 h-4 rounded-full transition-all duration-200"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,0,0,0.2) 0%, transparent 70%)",
            transform: `translateX(-50%) scale(${isHovered ? 1.1 : 1})`,
            opacity: isAnimating ? 0 : isHovered ? 0.8 : 0.5,
          }}
        />
      </button>
    </div>
  )
}

export function clearGiftRevealState(
  giftId: string,
  storageType: "local" | "session" = "session"
) {
  const storage = storageType === "session" ? sessionStorage : localStorage
  storage.removeItem(`gift_revealed_${giftId}`)
}
