import { NearIntentsLogoSymbolIcon } from "@src/icons"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-40 pb-20">
      <NearIntentsLogoSymbolIcon className="size-12 shrink-0" />
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-gray-400 animate-dot-bounce"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
