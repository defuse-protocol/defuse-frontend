"use client"

import Footer from "@src/components/Layout/Footer"
import { Header } from "@src/components/Layout/Header"
import { NavbarMobile } from "@src/components/Navbar/NavbarMobile"
import PageBackground from "@src/components/PageBackground"
import { appRoutes } from "@src/constants/routes"
import { WalletVerificationProvider } from "@src/providers/WalletVerificationProvider"
import type React from "react"
import type { PropsWithChildren } from "react"
import NavbarDesktop from "../Navbar/NavbarDesktop"
import Main from "./Main"

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        navbarSlot={
          <Header.DisplayNavbar>
            <NavbarDesktop links={appRoutes} />
          </Header.DisplayNavbar>
        }
      />
      <Main>{children}</Main>
      <Footer />
      <NavbarMobile links={appRoutes} />
      <PageBackground />
      <WalletVerificationProvider />
    </div>
  )
}

export default Layout
