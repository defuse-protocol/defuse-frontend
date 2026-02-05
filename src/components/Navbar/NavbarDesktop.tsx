"use client"

import { Plus, ShieldIcon } from "@phosphor-icons/react"
import { Button } from "@radix-ui/themes"
import { navigation } from "@src/constants/routes"
import { useIsActiveLink } from "@src/hooks/useIsActiveLink"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { usePrivateModeStore } from "@src/stores/usePrivateModeStore"
import { cn } from "@src/utils/cn"
import Link from "next/link"
import { useContext } from "react"
import type React from "react"

export function NavbarDesktop() {
  const { isActive } = useIsActiveLink()
  const isPrivateModeEnabled = usePrivateModeStore(
    (state) => state.isPrivateModeEnabled
  )

  const isAccountActive = isActive(navigation.account)
  const isTradeActive = isActive(navigation.home) || isActive(navigation.otc)
  const isHistoryActive = isActive(navigation.history)
  const isShieldActive = isActive(navigation.shield)

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

      {/* History */}
      <NavItem
        label="History"
        isActive={isHistoryActive}
        href={navigation.history}
        dataTestId="history-tab"
      />

      {/* Shield - only visible in private mode */}
      {isPrivateModeEnabled && (
        <NavItem
          label="Shield"
          isActive={isShieldActive}
          href={navigation.shield}
          dataTestId="shield-tab"
          icon={<ShieldIcon className="w-4 h-4" weight="bold" />}
        />
      )}
    </nav>
  )
}

function NavItem({
  label,
  isActive,
  href,
  dataTestId,
  icon,
}: {
  label: string
  isActive: boolean
  href: string
  dataTestId?: string
  icon?: React.ReactNode
}) {
  return (
    <Link href={href}>
      <Button
        radius="full"
        color="gray"
        highContrast
        variant={isActive ? "solid" : "soft"}
        className={cn(
          "relative text-sm transition-colors",
          isActive ? "text-gray-1" : "bg-transparent hover:bg-gray-a3"
        )}
        data-testid={dataTestId}
        asChild
      >
        <span className="text-sm font-bold whitespace-nowrap flex items-center gap-1.5">
          {icon}
          {label}
        </span>
      </Button>
    </Link>
  )
}

export function NavbarDeposit() {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const isOmniswap = whitelabelTemplate === "omniswap"

  return (
    <Link href={navigation.deposit} data-testid="deposit-tab">
      <Button
        radius="full"
        color={isOmniswap ? "grass" : "gray"}
        highContrast={!isOmniswap}
        variant="soft"
        className="flex items-center gap-2 text-sm"
      >
        <Plus
          className={cn(
            "size-3",
            isOmniswap ? "text-grass-11" : "text-gray-12"
          )}
          weight="bold"
        />
        <span className="text-sm font-bold whitespace-nowrap">Deposit</span>
      </Button>
    </Link>
  )
}
