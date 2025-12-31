"use client"

import {
  ArrowRightStartOnRectangleIcon,
  Cog8ToothIcon,
} from "@heroicons/react/16/solid"
import { UserIcon } from "@heroicons/react/24/solid"
import clsx from "clsx"
import Link from "next/link"
import { DropdownMenu } from "radix-ui"

const items = [
  {
    label: "Settings",
    href: "/settings",
    icon: Cog8ToothIcon,
  },
  {
    label: "Sign out",
    onClick: () => {
      // TODO: Sign out
    },
    icon: ArrowRightStartOnRectangleIcon,
  },
]

const UserMenu = () => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger className="bg-gray-900 rounded-2xl p-2 flex items-center gap-3 w-full">
      <div className="size-8 flex items-center justify-center bg-orange-500 rounded-lg">
        <UserIcon className="text-orange-100 size-5" />
      </div>

      <div className="text-gray-400 text-sm font-semibold">@username123</div>
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align="start"
        sideOffset={8}
        className={clsx(
          "min-w-64 flex flex-col gap-1 rounded-2xl p-1.5 isolate bg-white outline outline-transparent focus:outline-hidden shadow-lg ring-1 ring-gray-900/10",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:duration-100 data-[state=closed]:ease-in"
        )}
      >
        {items.map(({ href, onClick, icon: Icon, label }) => {
          const className =
            "group rounded-xl focus:outline-hidden focus:bg-gray-100 focus:text-gray-900 p-2.5 text-left text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-100 hover:text-gray-900 font-semibold"

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

export default UserMenu
