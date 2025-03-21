"use client"

import { Button, Text } from "@radix-ui/themes"
import clsx from "clsx"
import { usePathname } from "next/navigation"

import { LINKS_HEADER, type NavigationLinks } from "@src/constants/routes"
import { TURN_OFF_APPS } from "@src/utils/environment"

import Link from "next/link"
import { LabelComingSoon } from "./ComingSoon"

type Props = {
  links?: NavigationLinks[]
}

const Navbar = ({ links = LINKS_HEADER }: Props) => {
  const pathname = usePathname()
  return (
    <nav className="flex justify-between items-center gap-4">
      {links.map((route, i) => {
        const isCurrentPage = route.href === pathname
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: <reason>
          <Link key={i} href={route.href}>
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

export default Navbar
