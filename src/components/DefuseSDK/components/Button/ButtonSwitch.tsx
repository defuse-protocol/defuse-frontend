import { ArrowDownIcon } from "@radix-ui/react-icons"
import clsx from "clsx"
import type React from "react"

import { ButtonIcon } from "./ButtonIcon"

type Props = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
}

export const ButtonSwitch = ({ onClick, className = "" }: Props) => {
  return (
    <div className="absolute top-[50%] left-[50%] -translate-x-2/4 -translate-y-2/4 z-10">
      <ButtonIcon
        onClick={onClick}
        className={clsx(
          "absolute top-[50%] left-[50%] -translate-x-2/4 -translate-y-2/4 z-10 flex justify-center items-center w-[40px] h-[40px] rounded-md overflow-hidden bg-gray-1 shadow-switch-token dark:shadow-switch-token-dark",
          className && className
        )}
      >
        <ArrowDownIcon width={18} height={18} />
      </ButtonIcon>
    </div>
  )
}
