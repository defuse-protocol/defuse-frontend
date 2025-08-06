"use client"

import { CheckIcon, CopyIcon } from "@radix-ui/react-icons"
import { IconButton } from "@radix-ui/themes"
import clsx from "clsx"
import { type PropsWithChildren, useState, useTransition } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"

interface Props extends PropsWithChildren {
  value: string
}

const Copy = ({ children, value }: Props) => {
  const [isCopied, setIsCopied] = useState(false)
  const animationStyle = "transition ease-in-out duration-150"
  return (
    <div className="relative cursor-pointer">
      {/* @ts-ignore this is a valid use case */}
      <CopyToClipboard onCopy={() => setIsCopied(true)} text={value}>
        {children}
      </CopyToClipboard>
      <span
        className={clsx(
          "h-full absolute -top-[50%] -right-[62px] translate-y-1/2 text-xs leading-5 text-primary",
          animationStyle,
          isCopied ? "visible translate-x-0" : "invisible -translate-x-[5px]"
        )}
      >
        Copied
      </span>
    </div>
  )
}

export default Copy

export function CopyIconButton({ copyValue }: { copyValue: string }) {
  const [isCopied, startTransition] = useTransition()

  return (
    <IconButton
      size="3"
      radius="full"
      variant="soft"
      color="gray"
      highContrast
      onClick={() => {
        startTransition(async () => {
          try {
            await navigator.clipboard.writeText(copyValue)
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } catch {}
        })
      }}
    >
      {isCopied ? (
        <CheckIcon width="18" height="18" />
      ) : (
        <CopyIcon width="18" height="18" />
      )}
    </IconButton>
  )
}
