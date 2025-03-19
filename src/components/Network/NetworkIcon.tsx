import clsx from "clsx"
import Image from "next/image"

const NetworkIcon = ({
  chainIcon,
  chainName,
  isConnect,
}: {
  chainIcon: string
  chainName: string
  isConnect?: boolean
}) => {
  return (
    <div className="relative inline-block">
      <div
        className={clsx(
          "relative overflow-hidden w-[36px] h-[36px] flex justify-center items-center border border-silver-100 rounded-full dark:border-white",
          chainName === "near" && "bg-black",
          chainName === "eth" && "bg-white",
          chainName === "btc" && "bg-white"
        )}
      >
        <Image
          src={chainIcon}
          alt={chainName ?? "Network Logo"}
          width={20}
          height={20}
        />
      </div>
      {isConnect && (
        <div className="absolute bottom-0 -right-[7px]">
          <Image
            src="/static/icons/success.svg"
            alt="Network Logo"
            width={18}
            height={18}
          />
        </div>
      )}
    </div>
  )
}

export default NetworkIcon
