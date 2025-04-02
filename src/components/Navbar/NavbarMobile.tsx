"use client"

import NavbarDesktop from "@src/components/Navbar/NavbarDesktop"
import { appRoutes } from "@src/constants/routes"
import { usePathname } from "next/navigation"

const routes = ["Account", "Swap", "Deposit"]

const NavbarMobile = () => {
  const pathname = usePathname()

  return (
    <>
      <div className="fixed bottom-0 z-50 left-0 md:hidden w-full px-5 pt-3 pb-[max(env(safe-area-inset-bottom,0px),theme(spacing.3))] bg-white border-t-[1px] border-white-200">
        <NavbarDesktop links={appRoutes} />
      </div>
      <div className="block md:hidden h-[calc(44px+max(env(safe-area-inset-bottom,0px),theme(spacing.3)))]" />
    </>
  )
}

export default NavbarMobile
