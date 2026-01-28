"use client"

import { ListBulletIcon, PlusIcon } from "@heroicons/react/16/solid"
import TabSwitcher from "@src/components/TabSwitcher"
import { usePathname } from "next/navigation"

export function GiftsHeader() {
  const pathname = usePathname()

  return (
    <>
      <h1 className="text-gray-900 text-xl font-semibold tracking-tight">
        Gifts
      </h1>

      <TabSwitcher
        tabs={[
          {
            label: "My gifts",
            icon: <ListBulletIcon className="size-4 shrink-0" />,
            href: "/gifts",
            selected: pathname === "/gifts",
          },
          {
            label: "New gift",
            icon: <PlusIcon className="size-4 shrink-0" />,
            href: "/gifts/create",
            selected: pathname === "/gifts/create",
          },
        ]}
      />
    </>
  )
}
