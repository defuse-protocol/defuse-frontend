"use client"

import { Plus } from "@phosphor-icons/react"
import { Button } from "@radix-ui/themes"
import { navigation } from "@src/constants/routes"
import { useIsActiveLink } from "@src/hooks/useIsActiveLink"
import { cn } from "@src/utils/cn"
import Link from "next/link"

export function NavbarDesktop() {
  const { isActive } = useIsActiveLink()

  const isAccountActive = isActive(navigation.account)
  const isTradeActive = isActive(navigation.home) || isActive(navigation.otc)
  const isExploreActive = isActive(navigation.explore)
  return (
    <nav className="flex justify-between items-center gap-4">
      {/* Account */}
      <NavItem
        label="Account"
        isActive={isAccountActive}
        href={navigation.account}
      />

      {/* Trade */}
      <NavItem label="Trade" isActive={isTradeActive} href={navigation.home} />

      {/* Explore */}
      {/* <NavItem
        label="Explore"
        isActive={isExploreActive}
        href={navigation.explore}
      /> */}
    </nav>
  )
}

function NavItem({
  label,
  isActive,
  href,
}: {
  label: string
  isActive: boolean
  href: string
}) {
  return (
    <Link href={href}>
      <Button
        radius="full"
        color="gray"
        highContrast
        variant={isActive ? "solid" : "soft"}
        className={cn(
          "relative text-sm cursor-pointer",
          isActive ? "text-gray-1" : "bg-transparent"
        )}
        asChild
      >
        <span className="text-sm font-bold whitespace-nowrap">{label}</span>
      </Button>
    </Link>
  )
}

export function NavbarDeposit() {
  return (
    <Link href={navigation.deposit}>
      <Button
        radius="full"
        color="gray"
        highContrast
        variant="soft"
        className="flex items-center gap-2 text-sm cursor-pointer"
      >
        <Plus className="size-3 text-gray-12" weight="bold" />
        <span className="text-sm font-bold whitespace-nowrap">Deposit</span>
      </Button>
    </Link>
  )
}
