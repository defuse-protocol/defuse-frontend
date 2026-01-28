"use client"

import { Button, Text } from "@radix-ui/themes"
import AddTurboChainButton from "@src/components/AddTurboChainButton"
import Logo from "@src/components/Logo"
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
        Sign in or Sign up
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
        className={`${styles.header} h-[56px] fixed top-0 left-0 w-full md:relative border-b z-50 border-gray-a3`}
      >
        <div className="h-full flex justify-between items-center px-3">
          <div className="shrink-0">
            <Logo />
          </div>

          {/* Navbar */}
          <div className="grow flex justify-between items-center pl-8 pr-4">
            <div className="shrink-0">{navbarSlot}</div>
            <div className="shrink-0">{depositSlot}</div>
          </div>

          <div className="flex justify-end items-center gap-4 shrink-0">
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
  return (
    <div className="hidden md:flex items-center justify-between">
      {children}
      <div className="h-[20px] w-px bg-gray-5 ml-4" />
    </div>
  )
}
