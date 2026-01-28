"use client"

import Image from "next/image"
import { useState } from "react"

export function GiftTestCard({ onClick }: { onClick?: () => void }) {
  const [isHovered, setIsHovered] = useState(false)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateXValue = ((y - centerY) / centerY) * -15
    const rotateYValue = ((x - centerX) / centerX) * 15

    setRotateX(rotateXValue)
    setRotateY(rotateYValue)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <button
      type="button"
      className="relative w-full max-w-[320px] aspect-[1.6/1] cursor-pointer bg-transparent border-none p-0"
      style={{ perspective: "1000px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl transition-all duration-200 ease-out"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.02 : 1})`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Background image */}
        <Image
          src="/static/images/gift-blank-card.png"
          alt="Gift card"
          fill
          className="object-cover"
          priority
        />

        {/* Overlay with text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/10"
          style={{ transform: "translateZ(20px)" }}
        >
          <h2
            className="text-white text-xl font-black tracking-wide drop-shadow-lg"
            style={{
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            CLAIM YOUR GIFT
          </h2>
        </div>

        {/* Shine effect on hover */}
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

      {/* Shadow */}
      <div
        className="absolute -bottom-4 left-1/2 w-4/5 h-4 rounded-full transition-all duration-200"
        style={{
          background:
            "radial-gradient(ellipse, rgba(0,0,0,0.2) 0%, transparent 70%)",
          transform: `translateX(-50%) scale(${isHovered ? 1.1 : 1})`,
          opacity: isHovered ? 0.8 : 0.5,
        }}
      />
    </button>
  )
}
