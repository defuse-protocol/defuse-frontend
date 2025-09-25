import { cn } from "@src/components/DefuseSDK/utils/cn"

type GiftDescriptionProps = {
  description: string
  className?: string
}

export function GiftDescription(props: GiftDescriptionProps) {
  return (
    <div className={cn("text-sm font-medium text-gray-11", props.className)}>
      {props.description}
    </div>
  )
}
