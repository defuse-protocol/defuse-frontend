"use client"

import {
  ArrowRightStartOnRectangleIcon,
  ChevronUpIcon,
  Cog8ToothIcon,
} from "@heroicons/react/16/solid"
import { UserIcon } from "@heroicons/react/24/solid"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import clsx from "clsx"
import Link from "next/link"
import { DropdownMenu } from "radix-ui"
import { midTruncate } from "./DefuseSDK/features/withdraw/components/WithdrawForm/utils"

const UserMenu = () => {
  const { state, signOut } = useConnectWallet()

  // If not connected, show a link to login
  if (!state.address) {
    return (
      <Link
        href="/login"
        className="relative bg-gray-900 rounded-2xl px-3.5 py-3 flex items-center gap-3 w-full hover:bg-gray-950 mt-5"
      >
        <div className="size-7 flex items-center justify-center bg-gray-700 rounded-lg">
          <UserIcon className="text-gray-400 size-5" />
        </div>
        <div className="text-gray-400 text-sm font-semibold">Sign in</div>
      </Link>
    )
  }

  const items = [
    {
      label: "Settings",
      href: "/settings",
      icon: Cog8ToothIcon,
    },
    {
      label: "Sign out",
      onClick: () => {
        if (state.chainType) {
          signOut({ id: state.chainType })
        }
      },
      icon: ArrowRightStartOnRectangleIcon,
    },
  ]

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="relative group bg-gray-900 rounded-2xl px-3.5 py-3 flex items-center gap-3 w-full mt-5 hover:bg-gray-950">
        <div className="size-7 flex items-center justify-center bg-brand rounded-lg">
          <UserIcon className="text-white/80 size-5" />
        </div>

        <div className="text-gray-400 group-hover:text-gray-300 text-sm font-semibold grow text-left">
          {midTruncate(state.displayAddress ?? "")}
        </div>

        <ChevronUpIcon className="size-5 text-gray-400 shrink-0 group-hover:text-gray-300" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          className={clsx(
            "min-w-66 flex flex-col gap-1 rounded-2xl p-1.5 isolate bg-white outline outline-transparent focus:outline-hidden shadow-lg ring-1 ring-gray-900/10",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:duration-100 data-[state=closed]:ease-in"
          )}
        >
          {items.map(({ href, onClick, icon: Icon, label }) => {
            const className =
              "group rounded-xl focus:outline-hidden focus-visible:bg-gray-200 focus-visible:text-gray-900 p-2.5 text-left text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-200 hover:text-gray-900 font-semibold"

            const content = (
              <>
                <Icon className="size-4 text-gray-500 group-hover:text-gray-600 group-focus:text-gray-600" />
                {label}
              </>
            )

            return (
              <DropdownMenu.Item key={label} asChild>
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

export default UserMenu
