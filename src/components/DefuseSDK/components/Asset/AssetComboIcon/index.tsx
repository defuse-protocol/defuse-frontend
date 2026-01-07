import {
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowUpRightIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid"
import type { TransactionType } from "@src/components/DefuseSDK/features/account/types/sharedTypes"
import Themes from "@src/types/themes"
import clsx from "clsx"
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
  size?: "sm" | "md"
  badgeType?: TransactionType
}

const AssetComboIcon = ({
  icon,
  chainIcon,
  chainName,
  showChainIcon = false,
  className,
  style,
  size = "md",
  badgeType,
}: AssetComboIconProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <div className={clsx("relative inline-block", className)} style={style}>
      <div
        className={clsx(
          "relative overflow-hidden flex justify-center items-center rounded-full outline-1 outline-gray-900/10 -outline-offset-1",
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
            className="size-full object-contain bg-white"
          />
        ) : (
          <div className="relative overflow-hidden size-full flex justify-center items-center bg-gray-100 rounded-full">
            <div className="size-1/2 rounded-full border-2 border-gray-500 border-dashed" />
          </div>
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
        <Image
          className="absolute -right-[7px] -bottom-[7px] bg-gray-1 rounded-[6px] p-0.5 shadow-sm h-4 w-4"
          width={16}
          height={16}
          src={resolvedTheme === Themes.DARK ? chainIcon.dark : chainIcon.light}
          alt={chainName || "Network Logo"}
        />
      )}
    </div>
  )
}

export default AssetComboIcon
