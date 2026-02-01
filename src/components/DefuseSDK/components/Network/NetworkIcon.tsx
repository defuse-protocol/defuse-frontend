"use client"

import clsx from "clsx"
import { useTheme } from "next-themes"
import Image from "next/image"

export function NetworkIcon({
  chainIcon,
  sizeClassName = "size-10",
}: {
  chainIcon: { dark: string; light: string }
  sizeClassName?: string
}) {
  const { resolvedTheme } = useTheme()
  const iconSrc = resolvedTheme === "dark" ? chainIcon.dark : chainIcon.light

  return (
    <div
      className={clsx(
        "relative overflow-hidden flex justify-center items-center rounded-full outline-1 outline-gray-900/10 -outline-offset-1 shrink-0",
        sizeClassName
      )}
    >
      <Image
        src={iconSrc}
        alt=""
        className="size-full"
        width={40}
        height={40}
      />
    </div>
  )
}
