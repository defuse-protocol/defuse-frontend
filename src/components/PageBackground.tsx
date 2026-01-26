"use client"

import Image from "next/image"
import { useContext } from "react"

import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"

const PageBackground = () => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  if (whitelabelTemplate === "solswap") {
    return (
      <div className="absolute bottom-0 w-full h-full -z-[1]">
        <Image
          src="/static/templates/solswap/bg.png"
          alt={""}
          className="w-full h-full object-cover object-bottom"
          unoptimized
          priority
        />
      </div>
    )
  }

  if (whitelabelTemplate === "turboswap") {
    return (
      <div className="absolute bottom-0 w-full h-full -z-[1]">
        <div className="bg-[linear-gradient(180deg,#F9F9F8_0%,#F9F8E6_81.5%,#F9F8E6_100%)] dark:bg-[linear-gradient(180deg,#191918_50%,#52471E_100%)] w-full h-full" />
        <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-1/2 lg:left-[75%] -translate-x-1/2 w-[620px] h-[620px]">
          <Image
            src="/static/templates/turboswap/coin-frog.png"
            alt=""
            className="object-contain"
            fill
            unoptimized
            priority
          />
        </div>
      </div>
    )
  }

  if (whitelabelTemplate === "dogecoinswap") {
    return (
      <div className="hidden md:block absolute bottom-0 w-full h-full -z-[1]">
        <div className="w-full h-full bg-no-repeat bg-center bg-cover bg-[url('/static/templates/dogecoinswap/bg-light.jpg')] dark:bg-[url('/static/templates/dogecoinswap/bg-dark.jpg')]" />
      </div>
    )
  }

  if (whitelabelTemplate === "trumpswap") {
    return (
      <div className="absolute bottom-0 w-full h-full -z-[1]">
        <div className="w-full h-full bg-no-repeat bg-center bg-cover opacity-15 bg-[url('/static/templates/trumpswap/bg-usa-flag.webp')]" />
        <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-1/2 lg:left-[70%] -translate-x-1/2 w-[660px] h-[660px]">
          <Image
            src="/static/templates/trumpswap/trump-standing.png"
            alt=""
            className="object-contain"
            fill
            unoptimized
            priority
          />
        </div>
      </div>
    )
  }

  if (whitelabelTemplate === "rabitswap") {
    return (
      <div className="absolute bottom-0 w-full h-full -z-[1]">
        <Image
          src="/static/templates/rabitswap/bg.png"
          alt="RabbitSwap background"
          className="object-cover object-bottom"
          fill
          unoptimized
          priority
        />
      </div>
    )
  }

  if (whitelabelTemplate === "omniswap") {
    return (
      <div className="absolute bottom-0 w-full h-full -z-[1] bg-[var(--sand-2-alias)]">
        <div className="relative h-full w-full overflow-hidden">
          <div
            className="absolute bottom-0 sm:-bottom-4 md:-bottom-20 lg:-bottom-24 left-1/2 text-center text-transparent -translate-x-1/2 bg-clip-text bg-gradient-to-b from-black/[0.02] to-black/5 text-[12rem]/none sm:text-[18rem]/none md:text-[24rem]/none lg:text-[30rem]/none tracking-tighter font-bold dark:from-white/[0.01] dark:to-white/[0.03]"
            aria-hidden
          >
            omni
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute bottom-0 w-full h-full -z-[1]">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f5f0eb] via-[#ebe5df] to-[#e0d8d0] dark:from-[#0a0a0a] dark:via-[#0f0f0f] dark:to-[#0a0a0a]" />

      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,120,40,0.18),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,140,50,0.12),transparent)]" />

      {/* Bottom glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_120%,rgba(255,100,30,0.12),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_120%,rgba(255,140,50,0.08),transparent)]" />
    </div>
  )
}

export default PageBackground
