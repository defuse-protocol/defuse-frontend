import { cn } from "@src/components/DefuseSDK/utils/cn"

type IntentsLogoProps = {
  className?: string
}

export function IntentsLogo({ className }: IntentsLogoProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center h-[56px] -mx-6 -mt-6 pt-2 mb-2",
        className
      )}
    >
      <span className="text-xl font-black tracking-tighter">
        <span className="text-gray-12 hover:text-primary transition-colors duration-200">
          intents
        </span>
        <span className="text-gray-9 font-medium">.near</span>
      </span>
    </div>
  )
}
