import Button from "@src/components/Button"
import type { PropsWithChildren } from "react"
import type { RenderHostAppLink } from "../types/hostAppLink"

interface AuthGateProps extends PropsWithChildren {
  renderHostAppLink: RenderHostAppLink
  shouldRender: boolean
}

export function AuthGate({
  renderHostAppLink,
  shouldRender,
  children,
}: AuthGateProps) {
  return shouldRender
    ? (children ?? null)
    : renderHostAppLink(
        "sign-in",
        <Button size="xl" variant="primary" fullWidth>
          Sign in
        </Button>,
        { className: "w-full" }
      )
}
