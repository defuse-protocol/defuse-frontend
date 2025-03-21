import Link from "next/link"
import type { ReactNode } from "react"

import { useSignInWindowOpenState } from "@src/stores/useSignInWindowOpenState"

export function renderAppLink(
  routeName: "withdraw" | "deposit" | "gift" | "sign-in",
  children: ReactNode,
  props: { className?: string }
) {
  switch (routeName) {
    case "deposit":
      return (
        <Link href="/deposit" {...props}>
          {children}
        </Link>
      )
    case "withdraw":
      return (
        <Link href="/withdraw" {...props}>
          {children}
        </Link>
      )
    case "gift":
      return (
        <Link href="/gift" {...props}>
          {children}
        </Link>
      )
    case "sign-in":
      return (
        <button
          type="button"
          onClick={() => {
            useSignInWindowOpenState.getState().open()
          }}
          {...props}
        >
          {children}
        </button>
      )
    default:
      routeName satisfies never
      return <div {...props}>{children}</div>
  }
}
