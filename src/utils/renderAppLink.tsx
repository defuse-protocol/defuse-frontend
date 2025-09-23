import { useSignInWindowOpenState } from "@src/stores/useSignInWindowOpenState"
import Link from "next/link"
import type { ReadonlyURLSearchParams } from "next/navigation"
import type { ReactNode } from "react"

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
  props: { className?: string },
  searchParams?: ReadonlyURLSearchParams
) {
  switch (routeName) {
    case "deposit": {
      const prefilledFrom = searchParams?.get("from")
      return (
        <Link
          href={prefilledFrom ? `/deposit?from=${prefilledFrom}` : "/deposit"}
          {...props}
        >
          {children}
        </Link>
      )
    }
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
