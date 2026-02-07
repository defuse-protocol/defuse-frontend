import { CheckIcon, Square2StackIcon } from "@heroicons/react/16/solid"
import { cn } from "@src/utils/cn"
import { Slot } from "radix-ui"
import { type ReactNode, useEffect, useRef, useState } from "react"

interface CopyButtonProps {
  text: string
  ariaLabel?: string
  className?: string
}

export function CopyButton({ text, ariaLabel, className }: CopyButtonProps) {
  return (
    <Copy text={text}>
      {(copied) => (
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "flex items-center justify-center size-5 text-fg-tertiary hover:text-fg",
            className
          )}
        >
          {copied ? (
            <CheckIcon className="size-4" />
          ) : (
            <Square2StackIcon className="size-4" />
          )}
        </button>
      )}
    </Copy>
  )
}

export function Copy({
  children,
  text,
}: {
  children: (copied: boolean) => ReactNode
  text: string | (() => string)
}) {
  const [copied, setCopied] = useState(false)
  const abortCtrlRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortCtrlRef.current?.abort()
    }
  }, [])

  return (
    <Slot.Root
      onClick={async () => {
        abortCtrlRef.current?.abort()
        abortCtrlRef.current = new AbortController()

        try {
          const t = typeof text === "function" ? text() : text
          await navigator.clipboard.writeText(t)
        } catch {
          return
        }

        if (abortCtrlRef.current?.signal.aborted) {
          return
        }

        let timerId: ReturnType<typeof setTimeout>
        if (!copied) {
          setCopied(true)
          timerId = setTimeout(() => {
            setCopied(false)
          }, 2000)
        } else {
          setCopied(false)

          timerId = setTimeout(() => {
            setCopied(true)
            timerId = setTimeout(() => {
              setCopied(false)
            }, 2000)
          }, 125)
        }

        abortCtrlRef.current.signal.addEventListener("abort", () => {
          clearTimeout(timerId)
        })
      }}
    >
      {children(copied)}
    </Slot.Root>
  )
}
