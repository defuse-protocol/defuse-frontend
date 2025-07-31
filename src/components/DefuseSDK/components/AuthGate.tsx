import { Button } from "@radix-ui/themes"
import type { PropsWithChildren } from "react"
import type { RenderHostAppLink } from "../types/hostAppLink"
import { cn } from "../utils/cn"

interface AuthGateProps extends PropsWithChildren {
  renderHostAppLink: RenderHostAppLink
  shouldRender: boolean
  className?: string
}

export function AuthGate({
  renderHostAppLink,
  shouldRender,
  className,
  children,
}: AuthGateProps) {
  return shouldRender
    ? (children ?? null)
    : renderHostAppLink(
        "sign-in",
        <Button
          asChild
          size="4"
          className={cn("w-full h-14 font-bold", className)}
        >
          <div>Sign in</div>
        </Button>,
        { className: "w-full" }
      )
}
