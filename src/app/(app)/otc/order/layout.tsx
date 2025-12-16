import { settings } from "@src/config/settings"
import type { Metadata } from "next"

export function generateMetadata(): Metadata {
  return settings.metadata.otcView
}

export default function ViewOrderLayout({
  children,
}: { children: React.ReactNode }) {
  return <>{children}</>
}
