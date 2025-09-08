"use client"

import { Button } from "@radix-ui/themes"

import { settings } from "@src/config/settings"
import { BASE_URL } from "@src/utils/environment"

const TryDefuse = () => {
  return (
    <div className="w-full mx-auto flex flex-col items-center gap-6 pt-10 md:pt-0 z-10 my-[72px] md:mt-[148px] md:mb-[156px]">
      <h1 className="text-3xl md:text-6xl text-center font-bold md:text-nowrap">
        Welcome to {settings.appName}
      </h1>
      <p className="max-w-[561px] text-center text-xl md:text-[40px] font-black md:leading-[48px] tracking-[-0.4px] text-gray-11">
        Multichain DeFi Hub
      </p>
      <Button
        onClick={() => window.open(BASE_URL)}
        size="4"
        variant="solid"
        color="orange"
        className="cursor-pointer"
      >
        Try now
      </Button>
    </div>
  )
}

export default TryDefuse
