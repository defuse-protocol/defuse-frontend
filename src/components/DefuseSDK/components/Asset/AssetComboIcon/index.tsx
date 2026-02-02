import {
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowUpRightIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid"
import type { TransactionType } from "@src/components/DefuseSDK/features/account/types/sharedTypes"
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
  badgeType?: TransactionType
}

const AssetComboIcon = ({
  icon,
  chainIcon,
  chainName,
  showChainIcon = false,
  className,
  style,
  sizeClassName = "size-10",
  badgeType,
}: AssetComboIconProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <div
      className={clsx("relative inline-block rounded-full", className)}
      style={style}
    >
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
      {badgeType && (
        <div
          className="absolute -left-1.5 -top-1.5 rounded-full bg-gray-25 flex items-center justify-center size-5"
          aria-hidden
        >
          <div
            className={clsx(
              "rounded-full size-4 flex items-center justify-center",
              {
                "bg-sky-400": ["processing", "send"].includes(badgeType),
                "bg-green-500": ["success", "receive"].includes(badgeType),
                "bg-purple-500": badgeType === "swap",
                "bg-red-500": badgeType === "failed",
              }
            )}
          >
            {badgeType === "send" && (
              <ArrowUpRightIcon className="size-3.5 text-white" />
            )}
            {badgeType === "receive" && (
              <ArrowDownIcon className="size-3.5 text-white" />
            )}
            {badgeType === "swap" && (
              <ArrowPathIcon className="size-3.5 text-white" />
            )}
            {badgeType === "failed" && (
              <XMarkIcon className="size-3.5 text-white" />
            )}
            {badgeType === "success" && (
              <CheckIcon className="size-3.5 text-white" />
            )}
          </div>
        </div>
      )}
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
