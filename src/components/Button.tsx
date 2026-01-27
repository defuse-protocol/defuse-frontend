import clsx from "clsx"
import Link from "next/link"
import { type ReactNode, forwardRef } from "react"
import Spinner from "./Spinner"

type Props = {
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"]
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "destructive"
    | "destructive-soft"
  size?: "sm" | "md" | "lg" | "xl"
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  className?: string
  onClick?: React.MouseEventHandler<HTMLElement>
  href?: string
  target?: React.AnchorHTMLAttributes<HTMLAnchorElement>["target"]
  rel?: React.AnchorHTMLAttributes<HTMLAnchorElement>["rel"]
  children: ReactNode
}

type Ref = HTMLButtonElement | HTMLAnchorElement

const Button = forwardRef<Ref, Props>(function Button(
  {
    type = "button",
    variant = "primary",
    size = "md",
    fullWidth = false,
    disabled = false,
    loading = false,
    className = "",
    onClick,
    href,
    target,
    rel,
    children,
  },
  ref
) {
  const isDisabled = disabled || loading

  const classes = clsx(
    "items-center justify-center relative flex shrink-0 focus-visible:outline-2 disabled:pointer-events-none leading-none tracking-tight",
    variant === "primary" &&
      "bg-gray-900 text-white hover:bg-gray-700 outline-gray-900 disabled:bg-gray-200 disabled:text-gray-400 outline-offset-2",
    variant === "secondary" &&
      "bg-gray-100 text-gray-700 hover:bg-gray-200 outline-gray-900 disabled:text-gray-300 -outline-offset-2",
    variant === "outline" &&
      "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 outline-gray-900 -outline-offset-2",
    variant === "destructive" &&
      "bg-red-600 text-white hover:bg-red-700 outline-red-600 disabled:opacity-30 outline-offset-2",
    variant === "destructive-soft" &&
      "bg-red-50 text-red-700 hover:bg-red-100 outline-red-600 disabled:text-red-300 -outline-offset-2",
    size === "xl" && "h-13 px-5 text-base font-bold rounded-2xl",
    size === "lg" && "h-10 px-4 text-sm font-bold rounded-xl",
    size === "md" && "h-9 px-3 text-sm font-bold rounded-xl",
    size === "sm" && "h-8 px-3 text-sm font-semibold rounded-lg",
    fullWidth && "w-full",
    className
  )

  const content = (
    <>
      <span
        className={clsx("flex items-center", {
          "gap-x-1.5": ["sm", "md"].includes(size),
          "gap-x-2": ["lg", "xl"].includes(size),
          "opacity-0": loading,
        })}
      >
        {children}
      </span>
      {loading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Spinner />
        </div>
      )}
    </>
  )

  if (href) {
    if (disabled) {
      return (
        <button
          type={type}
          className={classes}
          disabled={isDisabled}
          ref={ref as React.Ref<HTMLButtonElement>}
        >
          {content}
        </button>
      )
    }

    if (!href.startsWith("/")) {
      return (
        <a
          href={href}
          className={classes}
          ref={ref as React.Ref<HTMLAnchorElement>}
          onClick={onClick}
          target={target}
          rel={rel}
        >
          {content}
        </a>
      )
    }

    return (
      <Link
        className={classes}
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        onClick={onClick}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
      disabled={isDisabled}
      ref={ref as React.Ref<HTMLButtonElement>}
    >
      {content}
    </button>
  )
})

export default Button
