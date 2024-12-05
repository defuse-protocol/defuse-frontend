"use client"

import React from "react"

import Logo from "@src/components/Logo"
import Navbar from "@src/components/Navbar"
import Settings from "@src/components/Settings"
import ConnectWallet from "@src/components/Wallet"
import styles from "./Header.module.css"

const Header = () => {
  return (
    <>
      <header
        className={`${styles.header} h-[56px] fixed top-0 left-0 w-full md:relative border-b-[1px] border-white-200 z-50 dark:bg-black-900 dark:border-black-600`}
      >
        <div className="h-full flex justify-between items-center px-3">
          <Logo />
          <div className="hidden md:flex justify-center w-full max-w-5xl pl-3">
            <Navbar />
          </div>
          <div className="flex justify-between items-center gap-4">
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
