import Layout from "@src/components/Layout"
import type React from "react"
import type { PropsWithChildren } from "react"

const ShieldDemoLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return <Layout>{children}</Layout>
}

export default ShieldDemoLayout
