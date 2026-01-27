import clsx from "clsx"
import Image from "next/image"

export function NetworkIcon({
  chainIcon,
  sizeClassName = "size-10",
}: {
  chainIcon: { dark: string; light: string }
  sizeClassName?: string
}) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden flex justify-center items-center rounded-full outline-1 outline-gray-900/10 -outline-offset-1",
        sizeClassName
      )}
    >
      <Image
        src={chainIcon.light}
        alt=""
        className="size-full"
        width={40}
        height={40}
      />
    </div>
  )
}
