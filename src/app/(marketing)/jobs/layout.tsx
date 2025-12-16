import type { Metadata } from "next"
import type React from "react"
import type { PropsWithChildren } from "react"

import Layout from "@src/components/Layout"
import { settings } from "@src/config/settings"

export const metadata: Metadata = settings.metadata.jobs

const JobsLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return <Layout>{children}</Layout>
}

export default JobsLayout
