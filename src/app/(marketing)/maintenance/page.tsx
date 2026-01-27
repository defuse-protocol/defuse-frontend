import { settings } from "@src/config/settings"
import { NearIntentsLogoSymbolIcon } from "@src/icons"
import type { Metadata } from "next"

export const metadata: Metadata = settings.metadata.maintenance

export default function MaintenancePage() {
  return (
    <div className="bg-white flex flex-col items-center justify-center px-4 flex-1">
      <div className="max-w-5xl w-full flex flex-col items-center justify-center">
        <NearIntentsLogoSymbolIcon className="size-10 shrink-0" />
        <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-gray-900 text-center">
          Under maintenance
        </h1>
        <p className="text-gray-500 mt-4 md:mt-6 text-lg md:text-xl text-center">
          We’re currently performing maintenance on our site.
          <br className="hidden md:block" /> Please check back soon.
        </p>
      </div>
    </div>
  )
}
