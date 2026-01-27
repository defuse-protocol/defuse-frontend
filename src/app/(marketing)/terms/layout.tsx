import { settings } from "@src/config/settings"
import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = settings.metadata.terms

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
