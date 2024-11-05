import type { Metadata } from "next"
import type React from "react"
import type { PropsWithChildren } from "react"

import Layout from "@src/components/Layout"

export const metadata: Metadata = {
  title: "Your Multichain DeFi Hub",
  description:
    "The premier platform for cross-chain liquidity and trading. Experience efficient, secure, and transparent swaps across multiple blockchains.",
}

const HomeLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return <Layout>{children}</Layout>
}

export default HomeLayout
