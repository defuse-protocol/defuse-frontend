"use client"

import Footer from "@src/components/Layout/Footer"
import { Header } from "@src/components/Layout/Header"
import { NavbarMobile } from "@src/components/Navbar/NavbarMobile"
import PageBackground from "@src/components/PageBackground"
import { WalletVerificationProvider } from "@src/providers/WalletVerificationProvider"
import type React from "react"
import type { PropsWithChildren } from "react"
import { NavbarDeposit, NavbarDesktop } from "../Navbar/NavbarDesktop"
import Main from "./Main"

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        navbarSlot={
          <Header.DisplayNavbar>
            <NavbarDesktop />
          </Header.DisplayNavbar>
        }
        depositSlot={
          <Header.DepositSlot>
            <NavbarDeposit />
          </Header.DepositSlot>
        }
      />
      <Main>{children}</Main>
      <Footer />
      <NavbarMobile />
      <PageBackground />
      <WalletVerificationProvider />
    </div>
  )
}

export default Layout
