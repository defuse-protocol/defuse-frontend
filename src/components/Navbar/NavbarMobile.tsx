"use client"

import { ArrowsLeftRight, Plus } from "@phosphor-icons/react"
import { navigation } from "@src/constants/routes"
import { useIsActiveLink } from "@src/hooks/useIsActiveLink"
import { cn } from "@src/utils/cn"
import Link from "next/link"

import type { ReactNode } from "react"

export function NavbarMobile() {
  const { isActive } = useIsActiveLink()

  const isAccountActive = isActive(navigation.account)
  const isTradeActive = isActive(navigation.home) || isActive(navigation.otc)
  const isDepositActive = isActive(navigation.deposit)

  return (
    <>
      <div className="fixed bottom-0 z-50 left-0 md:hidden w-full px-5 pt-3 pb-[max(env(safe-area-inset-bottom,0px),--spacing(3))] bg-gray-1 border-t border-gray-a3">
        <nav className="flex justify-around items-center gap-4">
          {/* Account */}
          <NavItem
            href={navigation.account}
            label="Account"
            isActive={isAccountActive}
            iconSlot={
              <NavItem.DisplayIcon>
                {<WalletIcon active={isAccountActive} />}
              </NavItem.DisplayIcon>
            }
          />

          {/* Trade */}
          <NavItem
            href={navigation.home}
            label="Trade"
            isActive={isTradeActive}
            iconSlot={
              <NavItem.DisplayIcon>
                <ArrowsLeftRight
                  className={cn(
                    "size-4",
                    isTradeActive ? "text-gray-12" : "text-gray-11"
                  )}
                  weight="bold"
                />
              </NavItem.DisplayIcon>
            }
          />

          {/* Deposit */}
          <NavItem
            href={navigation.deposit}
            label="Deposit"
            isActive={isDepositActive}
            iconSlot={
              <NavItem.DisplayIcon>
                {
                  <div
                    className={cn(
                      "flex items-center justify-center w-4 h-4 rounded-full",
                      isDepositActive ? "bg-gray-12" : "bg-gray-11"
                    )}
                  >
                    <Plus className="size-3 text-gray-1" weight="bold" />
                  </div>
                }
              </NavItem.DisplayIcon>
            }
          />
        </nav>
      </div>
      <div className="block md:hidden h-[calc(44px+max(env(safe-area-inset-bottom,0px),--spacing(3)))]" />
    </>
  )
}
function NavItem({
  href,
  label,
  isActive,
  iconSlot,
}: {
  href: string
  label: string
  isActive: boolean
  iconSlot: React.ReactNode
}) {
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
          isActive ? "font-medium text-gray-12" : "font-medium text-gray-11"
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
        "w-4 h-4  mask-[url(/static/icons/wallet_no_active.svg)] bg-no-repeat bg-contain",
        active ? "bg-gray-12" : "bg-gray-11"
      )}
    />
  )
}
