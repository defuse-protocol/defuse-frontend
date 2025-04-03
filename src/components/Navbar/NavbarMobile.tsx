"use client"

import { ArrowsDownUp, Plus } from "@phosphor-icons/react"
import type { AppRoutes, NavigationLinks } from "@src/constants/routes"
import { useIsActiveLink } from "@src/hooks/useIsActiveLink"
import { cn } from "@src/utils/cn"
import Link from "next/link"

import type { ReactNode } from "react"

type NavbarMobileProps = {
  links: Record<AppRoutes, NavigationLinks>
}

export function NavbarMobile({ links }: NavbarMobileProps) {
  const { isActive } = useIsActiveLink()
  const isTradeActive = isActive(links.swap.href) || isActive(links.otc.href)

  return (
    <>
      <div className="fixed bottom-0 z-50 left-0 md:hidden w-full px-5 pt-3 pb-[max(env(safe-area-inset-bottom,0px),theme(spacing.3))] bg-white border-t-[1px] border-white-200">
        <nav className="flex justify-around items-center gap-4">
          {/* Account */}
          <NavItem
            href={links.account.href}
            label={links.account.label}
            isActive={isActive(links.account.href)}
            iconSlot={
              <NavItem.DisplayIcon>
                {<WalletIcon active={isActive(links.account.href)} />}
              </NavItem.DisplayIcon>
            }
          />

          {/* Trade */}
          <NavItem
            href={links.swap.href}
            label="Trade"
            isActive={isTradeActive}
            iconSlot={
              <NavItem.DisplayIcon>
                {
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full",
                      isTradeActive ? "bg-gray-12" : "bg-accent-9"
                    )}
                  >
                    <ArrowsDownUp
                      className={cn(
                        "size-5",
                        isTradeActive ? "text-white" : "text-gray-12"
                      )}
                      weight="bold"
                    />
                  </div>
                }
              </NavItem.DisplayIcon>
            }
          />

          {/* Deposit */}
          <NavItem
            href={links.deposit.href}
            label={links.deposit.label}
            isActive={isActive(links.deposit.href)}
            iconSlot={
              <NavItem.DisplayIcon>
                {
                  <div
                    className={cn(
                      "flex items-center justify-center w-4 h-4 rounded-full",
                      isActive(links.deposit.href) ? "bg-gray-12" : "bg-gray-11"
                    )}
                  >
                    <Plus className="size-3 text-white" weight="bold" />
                  </div>
                }
              </NavItem.DisplayIcon>
            }
          />
        </nav>
      </div>
      <div className="block md:hidden h-[calc(44px+max(env(safe-area-inset-bottom,0px),theme(spacing.3)))]" />
    </>
  )
}
function NavItem({
  href,
  label,
  isActive,
  iconSlot,
}: NavigationLinks & { isActive: boolean; iconSlot: React.ReactNode }) {
  return (
    <Link href={href} className="flex flex-col items-center text-black">
      <div className="relative h-4">
        <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-4 h-4 bg-transparent" />
        <div className="absolute bottom-0 left-0 right-0 flex justify-center mb-1">
          {iconSlot}
        </div>
      </div>
      <span
        className={cn(
          "text-sm",
          isActive
            ? "font-medium text-gray-12 dark:text-black-400"
            : "font-medium text-gray-11"
        )}
      >
        {label}
      </span>
    </Link>
  )
}

NavItem.DisplayIcon = ({ children }: { children: ReactNode }) => {
  return <div className="relative">{children}</div>
}

function WalletIcon({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "w-4 h-4  [mask-image:url(/static/icons/wallet_no_active.svg)] bg-no-repeat bg-contain",
        active ? "bg-gray-12" : "bg-gray-11"
      )}
    />
  )
}
