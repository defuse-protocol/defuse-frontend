"use client"

import { Plus } from "@phosphor-icons/react"
import { Button } from "@radix-ui/themes"
import { navigation } from "@src/constants/routes"
import { useIsActiveLink } from "@src/hooks/useIsActiveLink"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { cn } from "@src/utils/cn"
import Link from "next/link"
import { useContext } from "react"

export function NavbarDesktop() {
  const { isActive } = useIsActiveLink()

  const isAccountActive = isActive(navigation.account)
  const isSwapActive = isActive(navigation.home)
  const isOtcActive = isActive(navigation.otc)
  const isHistoryActive = isActive(navigation.history)

  return (
    <nav className="flex justify-between items-center gap-4">
      {/* Account */}
      <NavItem
        label="Account"
        isActive={isAccountActive}
        href={navigation.account}
        dataTestId="account-tab"
      />

      {/* Swap */}
      <NavItem
        label="Swap"
        isActive={isSwapActive}
        href={navigation.home}
        dataTestId="swap-tab"
      />

      {/* OTC */}
      <NavItem
        label="OTC"
        isActive={isOtcActive}
        href={navigation.otc}
        dataTestId="otc-tab"
      />

      {/* History */}
      <NavItem
        label="History"
        isActive={isHistoryActive}
        href={navigation.history}
        dataTestId="history-tab"
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
          "relative text-sm transition-colors",
          isActive ? "text-gray-1" : "bg-transparent hover:bg-gray-a3"
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
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const { isActive } = useIsActiveLink()
  const isOmniswap = whitelabelTemplate === "omniswap"
  const isDepositActive = isActive(navigation.deposit)

  return (
    <Link href={navigation.deposit} data-testid="deposit-tab">
      <Button
        radius="full"
        color={isOmniswap ? "grass" : "gray"}
        highContrast={!isOmniswap}
        variant={isDepositActive ? "solid" : "soft"}
        className={cn(
          "flex items-center gap-2 text-sm",
          isDepositActive && !isOmniswap && "text-gray-1"
        )}
      >
        <Plus
          className={cn(
            "size-3",
            isDepositActive && !isOmniswap
              ? "text-gray-1"
              : isOmniswap
                ? "text-grass-11"
                : "text-gray-12"
          )}
          weight="bold"
        />
        <span className="text-sm font-bold whitespace-nowrap">Deposit</span>
      </Button>
    </Link>
  )
}
