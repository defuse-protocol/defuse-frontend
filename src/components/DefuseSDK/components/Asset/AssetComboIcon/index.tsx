import TokenIconPlaceholder from "@src/components/TokenIconPlaceholder"
import Themes from "@src/types/themes"
import clsx from "clsx"
import { useTheme } from "next-themes"
import Image from "next/image"
import type React from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../Tooltip"

type AssetComboIconProps = {
  icon?: string
  chainIcon?: { dark: string; light: string }
  chainName?: string
  showChainIcon?: boolean
  className?: React.HTMLAttributes<"div">["className"]
  style?: React.HTMLAttributes<"div">["style"]
  sizeClassName?: string
}

const AssetComboIcon = ({
  icon,
  chainIcon,
  chainName,
  showChainIcon = false,
  className,
  style,
  sizeClassName = "size-10",
}: AssetComboIconProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <div className={clsx("relative inline-block", className)} style={style}>
      <div
        className={clsx(
          "relative overflow-hidden flex justify-center items-center rounded-full outline-1 outline-gray-900/10 -outline-offset-1",
          sizeClassName
        )}
      >
        {icon ? (
          <img
            src={icon}
            alt=""
            className="size-full object-contain bg-white"
          />
        ) : (
          <TokenIconPlaceholder />
        )}
      </div>

      {showChainIcon && chainIcon && resolvedTheme && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute -right-1.5 -bottom-1.5 z-20 size-5 bg-white rounded-full flex items-center justify-center">
              <Image
                width={16}
                height={16}
                src={
                  resolvedTheme === Themes.DARK
                    ? chainIcon.dark
                    : chainIcon.light
                }
                alt=""
                className="size-4 object-contain"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent className="z-50" theme="dark">
            {chainName?.toUpperCase()}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

export default AssetComboIcon
