import { settings } from "@src/config/settings"
import type { Metadata } from "next"
import type { ReactNode } from "react"

export function generateMetadata(): Metadata {
  return settings.metadata.contacts
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
