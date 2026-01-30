"use client"

import { ListBulletIcon, PlusIcon } from "@heroicons/react/16/solid"
import PageHeader from "@src/components/PageHeader"
import TabSwitcher from "@src/components/TabSwitcher"
import { usePathname } from "next/navigation"

const DealsHeader = () => {
  const pathname = usePathname()

  return (
    <>
      <PageHeader
        title="Private trades"
        intro={
          <p>
            Say you want to swap some Bitcoin for Ethereum with someone
            anonymous you met on X. Normally you'd need to find a third party
            (an escrow) to hold the funds. With NEAR Intent Deals, you can
            configure the swap, send a link to the other party, and when they
            execute it, the funds are exchanged atomically and instantly.
          </p>
        }
      />

      <TabSwitcher
        tabs={[
          {
            label: "My trades",
            icon: <ListBulletIcon className="size-4 shrink-0" />,
            href: "/deals",
            selected: pathname === "/deals",
          },
          {
            label: "New trade",
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
