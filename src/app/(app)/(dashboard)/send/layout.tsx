import { whitelabelTemplateFlag } from "@src/config/featureFlags"
import { settings } from "@src/config/settings"
import type { Metadata } from "next"
import type React from "react"
import type { PropsWithChildren } from "react"

export async function generateMetadata(): Promise<Metadata> {
  const templ = await whitelabelTemplateFlag()

  if (templ !== "dogecoinswap") {
    return settings.metadata.send
  }

  return {}
}

const WithdrawLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return children
}

export default WithdrawLayout
