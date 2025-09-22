import Image from "next/image"

export function NetworkIcon({
  chainIcon,
  chainName,
}: {
  chainIcon: { dark: string; light: string }
  chainName: string
}) {
  return (
    <div className="relative flex size-7 items-center justify-center overflow-hidden rounded bg-white">
      <Image
        src={chainIcon.light}
        alt={chainName}
        className="size-4"
        width={16}
        height={16}
      />
    </div>
  )
}
