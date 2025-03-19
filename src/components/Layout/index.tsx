"use client"

import Footer from "@src/components/Layout/Footer"
import Header from "@src/components/Layout/Header"
import NavbarMobile from "@src/components/NavbarMobile"
import PageBackground from "@src/components/PageBackground"
import { WalletVerificationProvider } from "@src/providers/WalletVerificationProvider"
import type React from "react"
import type { PropsWithChildren } from "react"
import Main from "./Main"

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  // PREFETCH: Prefetch action could be done similarly to the prefetch action
  //           in _app.ts within the pages Router.
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Main>{children}</Main>
      <Footer />
      <NavbarMobile />
      <PageBackground />

      <WalletVerificationProvider />
    </div>
  )
}

export default Layout
