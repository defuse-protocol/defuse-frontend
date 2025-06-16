"use client"

import type React from "react"
import type { PropsWithChildren } from "react"

import Footer from "@src/components/Layout/Footer"
import { Header } from "@src/components/Layout/Header"
import { NavbarMobile } from "@src/components/Navbar/NavbarMobile"
import PageBackground from "@src/components/PageBackground"
import { usePathLogging } from "@src/hooks/usePathLogging"
import { MixpanelProvider } from "@src/providers/MixpanelProvider"
import { WalletVerificationProvider } from "@src/providers/WalletVerificationProvider"

import { NavbarDeposit, NavbarDesktop } from "../Navbar/NavbarDesktop"

import Main from "./Main"

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  usePathLogging()

  return (
    <div className="flex flex-col min-h-screen">
      <MixpanelProvider>
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
      </MixpanelProvider>
    </div>
  )
}

export default Layout
