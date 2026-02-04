"use client"

import { NearIntentsLogoIcon, NearIntentsLogoSymbolIcon } from "@src/icons"
import { useActivityDock } from "@src/providers/ActivityDockProvider"
import clsx from "clsx"
import Link from "next/link"
import ActivityDockMobile from "./ActivityDockMobile"
import UserMenuMobile from "./UserMenuMobile"

const MobileTopBar = () => {
  const { dockItems } = useActivityDock()
  const hasDockItems = dockItems.length > 0

  return (
    <div className="lg:hidden flex justify-between items-center pb-3 max-w-[464px] mx-auto w-full">
      <Link
        href="/account"
        className="-ml-1.5 pl-1.5 pr-2.5 py-1.5 flex items-center gap-2.5 rounded-xl focus-visible:outline-none"
      >
        <span className="sr-only">Account</span>
        <NearIntentsLogoSymbolIcon className="h-6 shrink-0" />
        <NearIntentsLogoIcon
          className={clsx(
            "h-2.5 shrink-0 text-white",
            hasDockItems && "hidden"
          )}
        />
      </Link>

      <ActivityDockMobile />

      <UserMenuMobile />
    </div>
  )
}

export default MobileTopBar
