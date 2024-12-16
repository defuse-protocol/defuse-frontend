"use client"

import React, { useContext } from "react"

import AddTurboChainButton from "@src/components/AddTurboChainButton"
import Logo from "@src/components/Logo"
import Navbar from "@src/components/Navbar"
import Settings from "@src/components/Settings"
import ConnectWallet from "@src/components/Wallet"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import styles from "./Header.module.css"

const Header = () => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  return (
    <>
      <header
        className={`${styles.header} h-[56px] fixed top-0 left-0 w-full md:relative border-b-[1px] border-white-200 z-50 dark:bg-black-900 dark:border-black-600`}
      >
        <div className="h-full flex justify-between items-center px-3">
          <div className="basis-[360px]">
            <Logo />
          </div>
          <div className="hidden md:flex flex-1 justify-center">
            <Navbar />
          </div>
          <div className="flex justify-end items-center gap-4 basis-[360px]">
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

export default Header
