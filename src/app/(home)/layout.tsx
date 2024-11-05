import type { Metadata } from "next"
import type React from "react"
import type { PropsWithChildren } from "react"

import Layout from "@src/components/Layout"

export const metadata: Metadata = {
  title: "Swap - Efficient Cross-Chain Asset Swapping",
  description:
    "Swap ensures fast transactions and the best rates across multiple blockchains. Start swapping today for a superior trading experience.",
}

const SwapLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return <Layout>{children}</Layout>
}

export default SwapLayout
