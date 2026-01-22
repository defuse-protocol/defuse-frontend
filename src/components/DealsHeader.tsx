"use client"

import { ListBulletIcon, PlusIcon } from "@heroicons/react/16/solid"
import TabSwitcher from "@src/components/TabSwitcher"
import { usePathname } from "next/navigation"

const DealsHeader = () => {
  const pathname = usePathname()

  return (
    <>
      <h1 className="text-gray-900 text-xl font-semibold tracking-tight">
        Private trades
      </h1>

      <TabSwitcher
        tabs={[
          {
            label: "My deals",
            icon: <ListBulletIcon className="size-4 shrink-0" />,
            href: "/deals",
            selected: pathname === "/deals",
          },
          {
            label: "New deal",
            icon: <PlusIcon className="size-4 shrink-0" />,
            href: "/deals/new",
            selected: pathname === "/deals/new",
          },
        ]}
      />
    </>
  )
}

export default DealsHeader
