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
            className="absolute bottom-0 sm:-bottom-4 md:-bottom-20 lg:-bottom-24 left-1/2 text-center text-transparent -translate-x-1/2 bg-clip-text bg-gradient-to-b from-black/[0.02] to-black/5 text-[12rem]/none sm:text-[18rem]/none md:text-[24rem]/none lg:text-[30rem]/none tracking-tighter font-bold"
            aria-hidden
          >
            omni
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute bottom-0 w-full h-full -z-[1] bg-gray-50 dark:bg-black-900">
      <div className="w-full h-full bg-no-repeat bg-bottom bg-page-light--mobile md:bg-page-light dark:bg-page-dark--mobile dark:md:bg-page-dark" />
    </div>
  )
}

export default PageBackground
