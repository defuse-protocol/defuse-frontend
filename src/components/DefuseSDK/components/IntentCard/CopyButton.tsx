import { CheckIcon, CopyIcon } from "@radix-ui/react-icons"
import { IconButton, Slot } from "@radix-ui/themes"
import { type ReactNode, useEffect, useRef, useState } from "react"

interface CopyButtonProps {
  text: string
  ariaLabel?: string
}

export function CopyButton({ text, ariaLabel }: CopyButtonProps) {
  return (
    <Copy text={text}>
      {(copied) => (
        <IconButton
          type="button"
          size="1"
          variant="ghost"
          color="gray"
          aria-label={ariaLabel}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </IconButton>
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
    <Slot
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
    </Slot>
  )
}
