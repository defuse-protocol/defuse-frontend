"use client"

import { ListBulletIcon, PlusIcon } from "@heroicons/react/16/solid"
import PageHeader from "@src/components/PageHeader"
import TabSwitcher from "@src/components/TabSwitcher"
import { usePathname } from "next/navigation"

export function GiftsHeader() {
  const pathname = usePathname()

  return (
    <>
      <PageHeader
        title="Gifts"
        intro="Send assets to your friends and help them get started on NEAR Intents, hassle-free.
"
      />

      <TabSwitcher
        className="mt-5"
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
            href: "/gifts/new",
            selected: pathname === "/gifts/new",
          },
        ]}
      />
    </>
  )
}
