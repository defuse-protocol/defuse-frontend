import { settings } from "@src/config/settings"
import type { Metadata } from "next"

export function generateMetadata(): Metadata {
  return settings.metadata.giftView
}

export default function ViewGiftLayout({
  children,
}: { children: React.ReactNode }) {
  return <>{children}</>
}
