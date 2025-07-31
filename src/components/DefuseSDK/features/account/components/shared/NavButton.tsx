import { Button } from "@radix-ui/themes"
import { type ReactNode, useId } from "react"
import type {
  HostAppRoute,
  RenderHostAppLink,
} from "../../../../types/hostAppLink"
import { cn } from "../../../../utils/cn"

type NavButtonProps = {
  variant: "primary" | "secondary"
  label: string
  icon: ReactNode
  routeName: HostAppRoute
  renderHostAppLink: RenderHostAppLink
  className?: string
}

export function NavButton({
  variant,
  label,
  icon,
  routeName,
  renderHostAppLink,
  className,
}: NavButtonProps) {
  const id = useId()
  return (
    <div
      className={cn("flex flex-col items-center gap-2 cursor-auto", className)}
    >
      {renderHostAppLink(
        routeName,
        <Button
          variant={variant === "primary" ? "solid" : "soft"}
          color={variant === "primary" ? undefined : "gray"}
          size="4"
          className="w-full"
          aria-hidden
          asChild
        >
          <div>{icon}</div>
        </Button>,
        {
          className: "w-full block",
          "aria-labelledby": id,
        }
      )}

      <div id={id} className="text-gray-12 text-sm font-bold" aria-hidden>
        {label}
      </div>
    </div>
  )
}
