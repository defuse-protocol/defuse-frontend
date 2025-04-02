"use client"

import { Button, Text } from "@radix-ui/themes"
import type { AppRoutes, NavigationLinks } from "@src/constants/routes"
import { TURN_OFF_APPS } from "@src/utils/environment"
import clsx from "clsx"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LabelComingSoon } from "../ComingSoon"

type NavbarDesktopProps = {
  links: Record<AppRoutes, NavigationLinks>
}

const NavbarDesktop = ({ links }: NavbarDesktopProps) => {
  const pathname = usePathname()
  return (
    <nav className="flex justify-between items-center gap-4">
      {Object.values(links).map((route) => {
        const isCurrentPage = route.href === pathname
        return (
          <Link key={route.href} href={route.href}>
            <Button
              radius="full"
              color="gray"
              highContrast
              variant={isCurrentPage ? "solid" : "soft"}
              className={clsx(
                "relative text-sm",
                TURN_OFF_APPS || route.comingSoon
                  ? "pointer-events-none text-gray-500"
                  : "cursor-pointer",
                isCurrentPage
                  ? "text-white dark:text-black-400"
                  : "bg-transparent"
              )}
              asChild
            >
              <div>
                <Text weight="bold" wrap="nowrap">
                  {route.label}
                </Text>
                {route.comingSoon && !isCurrentPage && <LabelComingSoon />}
              </div>
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}

export default NavbarDesktop
