import { Check as CheckIcon } from "@phosphor-icons/react"
import { Cross2Icon } from "@radix-ui/react-icons"
import { cn } from "@src/components/DefuseSDK/utils/cn"

type ActionIconProps = {
  type: "error" | "success"
}

export function ActionIcon({ type }: ActionIconProps) {
  return (
    <div className="flex justify-center items-start">
      <div
        className={cn(
          "w-[64px] h-[64px] flex items-center justify-center rounded-full",
          type === "error" ? "bg-red-4" : "bg-green-4"
        )}
      >
        {type === "error" ? (
          <Cross2Icon className="size-7 text-red-a11" />
        ) : (
          <CheckIcon weight="bold" className="size-7 text-green-a11" />
        )}
      </div>
    </div>
  )
}
