"use client"

import { Button, Text } from "@radix-ui/themes"
import clsx from "clsx"
import { usePathname, useRouter } from "next/navigation"

import { LINKS_HEADER, type NavigationLinks } from "@src/constants/routes"
import { LabelComingSoon } from "./ComingSoon"

const TURN_OFF_APPS = process?.env?.turnOffApps === "true" ?? true

type Props = {
  links?: NavigationLinks[]
}

const Navbar = ({ links = LINKS_HEADER }: Props) => {
  const pathname = usePathname()
  const router = useRouter()
  return (
    <nav className="flex justify-between items-center gap-4">
      {links.map((route, i) => {
        const isCurrentPage = route.href === pathname
        if (route.action) {
          return (
            <Button
              // biome-ignore lint/suspicious/noArrayIndexKey: <reason>
              key={i}
              type={"button"}
              onClick={route.action}
              disabled={TURN_OFF_APPS || route.comingSoon}
            >
              <Text weight="bold" wrap="nowrap">
                {route.label}
              </Text>
            </Button>
          )
        }
        return (
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
            // biome-ignore lint/suspicious/noArrayIndexKey: <reason>
            key={i}
            onClick={() => router.push(route.href ?? "")}
          >
            <Text weight="bold" wrap="nowrap">
              {route.label}
            </Text>
            {route.comingSoon && !isCurrentPage && <LabelComingSoon />}
          </Button>
        )
      })}
    </nav>
  )
}

export default Navbar
