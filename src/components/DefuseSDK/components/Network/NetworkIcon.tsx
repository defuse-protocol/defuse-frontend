import Image from "next/image"

export function NetworkIcon({
  chainIcon,
}: {
  chainIcon: { dark: string; light: string }
}) {
  return (
    <div className="relative overflow-hidden size-10 flex justify-center items-center rounded-full outline-1 outline-gray-900/10 -outline-offset-1">
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
