import type { ReactElement, ReactNode } from "react"

export type HostAppRoute =
  | "withdraw"
  | "deposit"
  | "gift"
  | "sign-in"
  | "swap"
  | "otc"
  | "account"

export type RenderHostAppLink = (
  routeName: HostAppRoute,
  children: ReactNode,
  props: { className?: string; "aria-labelledby"?: string }
) => ReactElement
