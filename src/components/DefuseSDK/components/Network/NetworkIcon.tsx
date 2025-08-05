import clsx from "clsx"

export function NetworkIcon({
  chainIcon,
  chainName,
}: {
  chainIcon: string
  chainName: string
}) {
  return (
    <div
      className={clsx(
        "relative flex size-7 items-center justify-center overflow-hidden rounded",
        chainName === "near" ? "bg-black" : "bg-white"
      )}
    >
      <img src={chainIcon} alt={chainName} className="size-4" />
    </div>
  )
}
