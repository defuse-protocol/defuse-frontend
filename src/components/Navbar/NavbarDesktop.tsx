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

  return (
    <nav className="flex justify-between items-center gap-4">
      {/* Account */}
      <NavItem
        label="Account"
        isActive={isAccountActive}
        href={navigation.account}
        dataTestId="account-tab"
      />

      {/* Trade */}
      <NavItem
        label="Trade"
        isActive={isTradeActive}
        href={navigation.home}
        dataTestId="trade-tab"
      />
    </nav>
  )
}

function NavItem({
  label,
  isActive,
  href,
  dataTestId,
}: {
  label: string
  isActive: boolean
  href: string
  dataTestId?: string
}) {
  return (
    <Link href={href}>
      <Button
        radius="full"
        color="gray"
        highContrast
        variant={isActive ? "solid" : "soft"}
        className={cn(
          "relative text-sm",
          isActive ? "text-gray-1" : "bg-transparent"
        )}
        data-testid={dataTestId}
        asChild
      >
        <span className="text-sm font-bold whitespace-nowrap">{label}</span>
      </Button>
    </Link>
  )
}

export function NavbarDeposit() {
  return (
    <Link href={navigation.deposit} data-testid="deposit-tab">
      <Button
        radius="full"
        color="gray"
        highContrast
        variant="soft"
        className="flex items-center gap-2 text-sm"
      >
        <Plus className="size-3 text-gray-12" weight="bold" />
        <span className="text-sm font-bold whitespace-nowrap">Deposit</span>
      </Button>
    </Link>
  )
}
