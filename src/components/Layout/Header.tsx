"use client"

import AddTurboChainButton from "@src/components/AddTurboChainButton"
import Logo from "@src/components/Logo"
import Settings from "@src/components/Settings"
import ConnectWallet from "@src/components/Wallet"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import type React from "react"
import { type ReactNode, useContext } from "react"
import styles from "./Header.module.css"

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
        className={`${styles.header} h-[56px] fixed top-0 left-0 w-full md:relative border-b-[1px] border-white-200 z-50 dark:bg-black-900 dark:border-black-600`}
      >
        <div className="h-full flex justify-between items-center px-3">
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Navbar */}
          <div className="flex-grow flex justify-between items-center pl-8 pr-4">
            <div className="flex-shrink-0">{navbarSlot}</div>
            <div className="flex-shrink-0">{depositSlot}</div>
          </div>

          <div className="flex justify-end items-center gap-4 flex-shrink-0">
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
      <div className="h-[20px] w-[1px] bg-gray-5 ml-4" />
    </div>
  )
}
