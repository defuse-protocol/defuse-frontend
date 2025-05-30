import Link from "next/link"
import type { ReactNode } from "react"

import { useSignInWindowOpenState } from "@src/stores/useSignInWindowOpenState"

export function renderAppLink(
  routeName:
    | "withdraw"
    | "deposit"
    | "gift"
    | "sign-in"
    | "swap"
    | "otc"
    | "account",
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
        <Link href="/gift-card/create-gift" {...props}>
          {children}
        </Link>
      )
    case "sign-in":
      return (
        <button
          type="button"
          onClick={() => {
            useSignInWindowOpenState.getState().setIsOpen(true)
          }}
          {...props}
        >
          {children}
        </button>
      )
    case "swap":
      return (
        <Link href="/" {...props}>
          {children}
        </Link>
      )
    case "otc":
      return (
        <Link href="/otc/create-order" {...props}>
          {children}
        </Link>
      )
    case "account":
      return (
        <Link href="/account" {...props}>
          {children}
        </Link>
      )
    default:
      routeName satisfies never
      return <div {...props}>{children}</div>
  }
}
