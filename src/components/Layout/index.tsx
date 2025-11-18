"use client"

import Footer from "@src/components/Layout/Footer"
import { Header } from "@src/components/Layout/Header"
import { NavbarMobile } from "@src/components/Navbar/NavbarMobile"
import PageBackground from "@src/components/PageBackground"
import { useMixpanelBus } from "@src/hooks/useMixpanelBus"
import { usePathLogging } from "@src/hooks/usePathLogging"
import { WalletVerificationProvider } from "@src/providers/WalletVerificationProvider"
import type { PropsWithChildren } from "react"
import { NavbarDeposit, NavbarDesktop } from "../Navbar/NavbarDesktop"
import { SystemStatus } from "../SystemStatus"
import Main from "./Main"

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  usePathLogging()
  useMixpanelBus()

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
      <SystemStatus.Desktop />
    </div>
  )
}

export default Layout
