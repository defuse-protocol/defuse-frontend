"use client"

import Footer from "@src/components/Layout/Footer"
import Header from "@src/components/Layout/Header"
import NavbarMobile from "@src/components/NavbarMobile"
import PageBackground from "@src/components/PageBackground"
import { WalletVerificationProvider } from "@src/providers/WalletVerificationProvider"
import type React from "react"
import type { PropsWithChildren } from "react"
import Main from "./Main"

type LayoutProps = PropsWithChildren & {
  enableBackground?: boolean
}

const Layout: React.FC<LayoutProps> = ({
  children,
  enableBackground = true,
}) => {
  // PREFETCH: Prefetch action could be done similarly to the prefetch action
  //           in _app.ts within the pages Router.
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Main>{children}</Main>
      <Footer />
      <NavbarMobile />
      {enableBackground && <PageBackground />}

      <WalletVerificationProvider />
    </div>
  )
}

export default Layout
