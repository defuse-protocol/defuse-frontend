import { whitelabelTemplateFlag } from "@src/config/featureFlags"
import { settings } from "@src/config/settings"
import type { Metadata } from "next"
import type { ReactNode } from "react"

export async function generateMetadata(): Promise<Metadata> {
  const templ = await whitelabelTemplateFlag()

  if (templ !== "dogecoinswap") {
    return settings.metadata.deposit
  }

  return {}
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
