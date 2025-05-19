"use client"

import { Plus } from "@phosphor-icons/react"
import { Button } from "@radix-ui/themes"
import { navigation } from "@src/constants/routes"
import { useIsActiveLink } from "@src/hooks/useIsActiveLink"
import { cn } from "@src/utils/cn"
import { useRouter } from "next/navigation"

export function NavbarDesktop() {
  const { isActive } = useIsActiveLink()
  const router = useRouter()

  const isAccountActive = isActive(navigation.account)
  const isTradeActive = isActive(navigation.home) || isActive(navigation.otc)
  const isExploreActive = isActive(navigation.explore)
  return (
    <nav className="flex justify-between items-center gap-4">
      {/* Account */}
      <NavItem
        label="Account"
        isActive={isAccountActive}
        onNavigate={() => router.push(navigation.account)}
      />

      {/* Trade */}
      <NavItem
        label="Trade"
        isActive={isTradeActive}
        onNavigate={() => router.push(navigation.home)}
      />

      {/* Explore */}
      <NavItem
        label="Explore"
        isActive={isExploreActive}
        onNavigate={() => router.push(navigation.explore)}
      />
    </nav>
  )
}

function NavItem({
  label,
  isActive,
  onNavigate,
}: {
  label: string
  isActive: boolean
  onNavigate: () => void
}) {
  return (
    <Button
      radius="full"
      color="gray"
      highContrast
      variant={isActive ? "solid" : "soft"}
      className={cn(
        "relative text-sm cursor-pointer",
        isActive ? "text-gray-1" : "bg-transparent"
      )}
      onClick={onNavigate}
      asChild
    >
      <span className="text-sm font-bold whitespace-nowrap">{label}</span>
    </Button>
  )
}

export function NavbarDeposit() {
  const router = useRouter()
  return (
    <Button
      radius="full"
      color="gray"
      highContrast
      variant="soft"
      className="flex items-center gap-2 text-sm cursor-pointer"
      onClick={() => router.push(navigation.deposit)}
    >
      <Plus className="size-3 text-gray-12" weight="bold" />
      <span className="text-sm font-bold whitespace-nowrap">Deposit</span>
    </Button>
  )
}
