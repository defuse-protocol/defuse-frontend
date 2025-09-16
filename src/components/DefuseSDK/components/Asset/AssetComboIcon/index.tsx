import { Tooltip } from "@radix-ui/themes"
import Themes from "@src/types/themes"
import { useTheme } from "next-themes"
import Image from "next/image"
import type React from "react"

type AssetComboIconProps = {
  icon?: string
  name?: string
  chainIcon?: { dark: string; light: string }
  chainName?: string
  showChainIcon?: boolean
  className?: React.HTMLAttributes<"div">["className"]
  style?: React.HTMLAttributes<"div">["style"]
}

export const AssetComboIcon = ({
  icon,
  name,
  chainIcon,
  chainName,
  showChainIcon = false,
  className = "",
  style,
}: AssetComboIconProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <div className={`relative inline-block ${className}`} style={style}>
      <div className="relative overflow-hidden size-7 flex justify-center items-center rounded-full">
        {icon ? (
          <img
            src={icon}
            alt={name || "Coin Logo"}
            className="w-full h-full object-contain"
          />
        ) : (
          <EmptyAssetComboIcon />
        )}
      </div>
      {showChainIcon && chainIcon && resolvedTheme && (
        <Tooltip
          className="z-50"
          side="left"
          content={chainName?.toUpperCase()}
        >
          <Image
            className="absolute -right-[7px] -bottom-[7px] bg-gray-1 rounded-full p-0.5 shadow-sm h-4 w-4"
            width={16}
            height={16}
            src={
              resolvedTheme === Themes.DARK ? chainIcon.dark : chainIcon.light
            }
            alt={chainName || "Network Logo"}
          />
        </Tooltip>
      )}
    </div>
  )
}

const EmptyAssetComboIcon = () => {
  return (
    <div className="relative overflow-hidden size-7 flex justify-center items-center border border-silver-100 rounded-full" />
  )
}
