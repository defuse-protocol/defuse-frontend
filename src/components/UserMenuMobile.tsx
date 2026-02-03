"use client"

import {
  ArrowRightStartOnRectangleIcon,
  CheckIcon,
  Cog8ToothIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/16/solid"
import { UserIcon } from "@heroicons/react/24/solid"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import clsx from "clsx"
import Link from "next/link"
import { DropdownMenu } from "radix-ui"
import { useState } from "react"
import { midTruncate } from "./DefuseSDK/features/withdraw/components/WithdrawForm/utils"

const UserMenuMobile = () => {
  const { state, signOut } = useConnectWallet()
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = async () => {
    if (state.address) {
      await navigator.clipboard.writeText(state.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const items = [
    {
      label: "Sign out",
      onClick: () => {
        if (state.chainType) {
          signOut({ id: state.chainType })
        }
      },
      icon: ArrowRightStartOnRectangleIcon,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Cog8ToothIcon,
    },
    {
      label: copied ? "Copied!" : "Copy account address",
      onClick: handleCopyAddress,
      icon: copied ? CheckIcon : DocumentDuplicateIcon,
      preventClose: true,
    },
  ]

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="relative group text-gray-400 rounded-xl -mr-1.5 pl-2.5 pr-1.5 py-1.5 flex items-center gap-2.5 data-[state=open]:bg-gray-950 data-[state=open]:text-gray-300 focus-visible:outline-none">
        <div className="text-sm font-semibold grow text-right">
          {midTruncate(state.displayAddress ?? "")}
        </div>

        <div className="size-6 flex items-center justify-center bg-brand rounded-md">
          <UserIcon className="text-white/80 size-4" />
        </div>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="bottom"
          align="end"
          sideOffset={2}
          className={clsx(
            "flex flex-col-reverse gap-1 bg-gray-900 rounded-2xl shadow-xl p-1.5 space-y-1 min-w-56 origin-top-right duration-100",

            "data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2 fade-in data-[state=open]:ease-out data-[state=open]:zoom-in-97",

            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2 fade-out data-[state=closed]:ease-in data-[state=closed]:zoom-out-97"
          )}
        >
          <DropdownMenu.Arrow className="fill-gray-900" />
          {items.map(({ href, onClick, icon: Icon, label, preventClose }) => {
            const className =
              "group flex items-center gap-2.5 py-2.5 px-3 rounded-xl"

            const content = (
              <>
                <Icon className="size-4 shrink-0 text-gray-400" />
                <span className="text-sm font-semibold text-gray-200">
                  {label}
                </span>
              </>
            )

            return (
              <DropdownMenu.Item
                key={label}
                asChild
                onSelect={preventClose ? (e) => e.preventDefault() : undefined}
              >
                {href ? (
                  <Link href={href} className={className}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" onClick={onClick} className={className}>
                    {content}
                  </button>
                )}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default UserMenuMobile
