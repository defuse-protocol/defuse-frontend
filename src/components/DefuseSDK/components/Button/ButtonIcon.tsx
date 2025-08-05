import clsx from "clsx"
import type { MouseEvent, PropsWithChildren } from "react"

interface Props extends PropsWithChildren {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  icon?: string
  className: string
  iconWidth?: number
  iconHeight?: number
}

export const ButtonIcon = ({
  onClick,
  icon,
  className = "",
  iconWidth = 18,
  iconHeight = 18,
  children,
}: Props) => {
  return (
    <button
      type="button"
      className={clsx(
        "flex justify-center items-center w-[40px] h-[40px] rounded-md overflow-hidden bg-gray-1",
        className && className
      )}
      onClick={onClick && onClick}
    >
      <div className="flex w-full h-full justify-center items-center bg-white-200 dark:bg-black-800">
        {icon && (
          <img
            src={icon}
            alt="button-icon"
            className={`w-[${iconWidth as number}px] h-[${iconHeight as number}px]`}
          />
        )}
        {children}
      </div>
    </button>
  )
}
