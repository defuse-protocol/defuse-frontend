import { settings } from "@src/config/settings"
import { NearIntentsLogoIcon, NearIntentsLogoSymbolIcon } from "@src/icons"
import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

export function generateMetadata(): Metadata {
  return settings.metadata.giftView
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-svh w-full bg-surface-page p-2">
      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-2 bg-surface-card rounded-3xl overflow-hidden">
        <div className="flex-1 px-4 py-12 md:px-6 flex flex-col items-center justify-center">
          <div className="max-w-md w-full">
            <Link href="/" className="inline-block mb-8 md:mb-12">
              <span className="sr-only">Home</span>
              <NearIntentsLogoIcon className="h-3 md:h-4 text-fg" />
            </Link>

            {children}
          </div>
        </div>

        <div className="bg-surface-active flex flex-col items-center justify-center px-6 py-12">
          <div className="bg-brand rounded-3xl p-6 flex flex-col items-center justify-center aspect-[1.586] w-full max-w-md shadow-2xl">
            <NearIntentsLogoSymbolIcon className="size-24 shrink-0" />
          </div>
        </div>
      </main>
    </div>
  )
}
