"use client"

import { Button, Text } from "@radix-ui/themes"
import AddTurboChainButton from "@src/components/AddTurboChainButton"
import Settings from "@src/components/Settings"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import dynamic from "next/dynamic"
import { type ReactNode, useContext } from "react"
import styles from "./Header.module.css"

// Prevent hydration mismatch by disabling SSR for wallet component
const ConnectWallet = dynamic(() => import("@src/components/Wallet"), {
  ssr: false,
  loading: () => (
    <Button type={"button"} variant={"solid"} size={"2"} radius={"full"}>
      <Text weight="bold" wrap="nowrap">
        Sign in
      </Text>
    </Button>
  ),
})

export function Header({
  navbarSlot,
  depositSlot,
}: {
  navbarSlot?: ReactNode
  depositSlot?: ReactNode
}) {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  return (
    <>
      <header
        className={`${styles.header} h-[56px] fixed top-0 left-0 w-full md:relative z-50`}
      >
        <div className="h-full flex justify-between items-center px-3">
          {/* Left spacer for balance */}
          <div className="flex-1" />

          {/* Navbar centered */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">{navbarSlot}</div>
            <div className="flex-shrink-0">{depositSlot}</div>
          </div>

          {/* Right side */}
          <div className="flex-1 flex justify-end items-center gap-4">
            {whitelabelTemplate === "turboswap" && (
              <div className="hidden md:block">
                <AddTurboChainButton />
              </div>
            )}
            <ConnectWallet />
            <Settings />
          </div>
        </div>
      </header>
      <div className="block md:hidden h-[56px]" />
    </>
  )
}

Header.DisplayNavbar = function DisplayNavbar({
  children,
}: {
  children: ReactNode
}) {
  return <div className="hidden md:flex flex-1 justify-center">{children}</div>
}

Header.DepositSlot = function DepositSlot({
  children,
}: {
  children: ReactNode
}) {
  return <div className="hidden md:flex items-center">{children}</div>
}
