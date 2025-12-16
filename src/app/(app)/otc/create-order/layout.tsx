import { settings } from "@src/config/settings"
import type { Metadata } from "next"

export function generateMetadata(): Metadata {
  return settings.metadata.otcCreate
}

export default function CreateOrderLayout({
  children,
}: { children: React.ReactNode }) {
  return <>{children}</>
}
