import { settings } from "@src/config/settings"
import type { Metadata } from "next"

export function generateMetadata(): Metadata {
  return settings.metadata.giftCreate
}

export default function CreateGiftLayout({
  children,
}: { children: React.ReactNode }) {
  return <>{children}</>
}
