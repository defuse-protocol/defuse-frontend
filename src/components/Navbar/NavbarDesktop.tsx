"use client"

import type { FeatureFlagValues } from "@src/components/PreloadFeatureFlags"
import { useIsActiveLink } from "@src/hooks/useIsActiveLink"
import {
  AccountIcon,
  ContactsIcon,
  DealsIcon,
  EarnIcon,
  HistoryIcon,
  SwapSquareIcon,
} from "@src/icons"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { cn } from "@src/utils/cn"
import Link from "next/link"
import { type ComponentType, useContext } from "react"

export type NavItemType = {
  label: string
  href: string
  showInTabs?: boolean
  icon: ComponentType<React.SVGProps<SVGSVGElement>>
  shortLabel?: string
}

export const navItems: NavItemType[] = [
  {
    label: "Account",
    href: "/account",
    icon: AccountIcon,
    showInTabs: true,
  },
  {
    label: "Swap",
    href: "/swap",
    icon: SwapSquareIcon,
    showInTabs: true,
  },
  {
    label: "Earn",
    href: "/earn",
    icon: EarnIcon,
  },
  {
    label: "Private deals",
    shortLabel: "Deals",
    href: "/deals",
    icon: DealsIcon,
    showInTabs: true,
  },
  {
    label: "History",
    href: "/history",
    icon: HistoryIcon,
    showInTabs: true,
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: ContactsIcon,
  },
]

const disabledRoutes: Record<string, keyof FeatureFlagValues> = {
  "/swap": "isSwapDisabled",
  "/deposit": "isDepositsDisabled",
  "/transfer": "isWithdrawDisabled",
  "/deals": "isDealsDisabled",
  "/earn": "isEarnDisabled",
}

export function useVisibleNavItems() {
  const flags = useContext(FeatureFlagsContext)
  return navItems.filter((item) => {
    const key = disabledRoutes[item.href]
    return !key || !flags[key]
  })
}

export function NavbarDesktop() {
  const visibleItems = useVisibleNavItems()

  return (
    <nav className="space-y-1">
      {visibleItems.map((item) => (
        <NavItem key={item.label} {...item} />
      ))}
    </nav>
  )
}

function NavItem({ label, href, icon: Icon }: NavItemType) {
  const { isActive } = useIsActiveLink()

  return (
    <Link
      href={href}
      key={label}
      className={cn(
        "flex items-center gap-4 py-3.5 px-3.5 rounded-2xl",
        isActive(href)
          ? "text-sidebar-fg bg-sidebar-active"
          : "text-sidebar-muted hover:text-sidebar-fg hover:bg-sidebar-hover"
      )}
    >
      <span className="w-6 flex items-center justify-center">
        <Icon className="size-5.5 shrink-0" />
      </span>
      <span className="text-base/5 font-semibold">{label}</span>
    </Link>
  )
}
