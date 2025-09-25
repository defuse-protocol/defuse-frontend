"use client"

import { Text } from "@radix-ui/themes"
import Image from "next/image"

type Props = {
  name: string
  icon: string
  link: string
}
const CardSocial = ({ name, icon, link }: Props) => {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <reason>
    <div
      onClick={() => {
        window.open(link)
      }}
      className="relative p-4 ld:p-8 shadow-card-multi bg-white rounded-2xl min-w-full lg:min-w-[335px] cursor-pointer"
    >
      <div className="flex items-center lg:items-start  lg:flex-col gap-4">
        <Image src={icon} width={48} height={48} alt="Social Icon" />
        <Text className="text-base md:text-xl text-gray-11 font-bold">
          {name}
        </Text>
      </div>
      <div className="absolute inset-y-1/2 -translate-y-[12px] lg:translate-y-0 lg:top-5 right-5">
        <Image
          src="/static/icons/arrow-top-right.svg"
          width={24}
          height={24}
          alt="Link Icon"
        />
      </div>
    </div>
  )
}

export default CardSocial
