import clsx from "clsx"

const ListItemsSkeleton = ({
  count,
  loading = false,
  className,
}: { count: number; loading?: boolean; className?: string }) => (
  <div className={clsx("flex flex-col gap-1", className)}>
    {[...Array(count).keys()].map((n) => (
      <div key={n} className="flex items-center gap-3 py-4">
        <div
          className={clsx(
            "size-10 rounded-full shrink-0",
            loading ? "bg-border animate-pulse" : "bg-surface-active"
          )}
        />
        <div className="flex-1 flex flex-col gap-1">
          <div
            className={clsx(
              "h-4 w-12 rounded-sm",
              loading ? "bg-border animate-pulse" : "bg-surface-active"
            )}
          />
          <div
            className={clsx(
              "h-4 w-6 rounded-sm",
              loading ? "bg-border animate-pulse" : "bg-surface-active"
            )}
          />
        </div>
        <div className="flex flex-col gap-1 items-end">
          <div
            className={clsx(
              "h-4 w-12 rounded-sm",
              loading ? "bg-border animate-pulse" : "bg-surface-active"
            )}
          />
          <div
            className={clsx(
              "h-4 w-6 rounded-sm",
              loading ? "bg-border animate-pulse" : "bg-surface-active"
            )}
          />
        </div>
      </div>
    ))}
  </div>
)

export default ListItemsSkeleton
