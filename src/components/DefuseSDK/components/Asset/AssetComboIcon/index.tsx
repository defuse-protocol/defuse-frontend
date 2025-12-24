import Themes from "@src/types/themes"
import clsx from "clsx"
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
  className?: React.HTMLAttributes<"div">["className"]
  style?: React.HTMLAttributes<"div">["style"]
  size?: "sm" | "md"
}

const AssetComboIcon = ({
  icon,
  chainIcon,
  chainName,
  showChainIcon = false,
  className,
  style,
  size = "md",
}: AssetComboIconProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <div className={clsx("relative inline-block", className)} style={style}>
      <div
        className={clsx(
          "relative overflow-hidden flex justify-center items-center rounded-full",
          {
            "size-7": size === "sm",
            "size-10": size === "md",
          }
        )}
      >
        {icon ? (
          <img
            src={icon}
            alt=""
            className="size-full object-contain bg-gray-100"
          />
        ) : (
          <div className="relative overflow-hidden size-full flex justify-center items-center bg-gray-100 rounded-full">
            <div className="size-1/2 rounded-full border-2 border-gray-500 border-dashed" />
          </div>
        )}
      </div>
      {showChainIcon && chainIcon && resolvedTheme && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Image
              className="absolute -right-[7px] -bottom-[7px] bg-gray-1 rounded-md p-0.5 shadow-xs h-4 w-4"
              width={16}
              height={16}
              src={
                resolvedTheme === Themes.DARK ? chainIcon.dark : chainIcon.light
              }
              alt=""
            />
          </TooltipTrigger>
          <TooltipContent side="left" className="z-50">
            {chainName?.toUpperCase()}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

export default AssetComboIcon
