import Themes from "@src/types/themes"
import { useTheme } from "next-themes"
import Image from "next/image"
import type React from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../Tooltip"

type AssetComboIconProps = {
  icon?: string
  name?: string
  chainIcon?: { dark: string; light: string }
  chainName?: string
  showChainIcon?: boolean
  iconSize?: string
  className?: React.HTMLAttributes<"div">["className"]
  style?: React.HTMLAttributes<"div">["style"]
}

export const AssetComboIcon = ({
  icon,
  name,
  chainIcon,
  chainName,
  showChainIcon = false,
  iconSize = "size-7",
  className = "",
  style,
}: AssetComboIconProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <div className={`relative inline-block ${className}`} style={style}>
      <div
        className={`relative overflow-hidden ${iconSize} flex justify-center items-center rounded-full`}
      >
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Image
              className="absolute -right-[7px] -bottom-[7px] bg-gray-1 rounded-[6px] p-0.5 shadow-sm h-4 w-4 cursor-pointer"
              width={16}
              height={16}
              src={
                resolvedTheme === Themes.DARK ? chainIcon.dark : chainIcon.light
              }
              alt={chainName || "Network Logo"}
            />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={4} className="capitalize">
            {chainName || "Network"}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

const EmptyAssetComboIcon = () => {
  return <div className="w-full h-full border border-silver-100 rounded-full" />
}
