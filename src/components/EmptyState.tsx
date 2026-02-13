import clsx from "clsx"
import type { ReactNode } from "react"
import ListItemsSkeleton from "./ListItemsSkeleton"

const EmptyState = ({
  className,
  loading = false,
  children,
}: {
  className?: string
  loading?: boolean
  children: ReactNode
}) => (
  <section className={clsx(className)}>
    <ListItemsSkeleton count={3} loading={loading} />
    <div className="max-w-72 mx-auto -mt-5 relative flex flex-col items-center">
      {children}
    </div>
  </section>
)

const Title = ({ children }: { children: ReactNode }) => (
  <h3 className="text-xl font-semibold text-fg text-center tracking-tight text-balance">
    {children}
  </h3>
)

const Description = ({ children }: { children: ReactNode }) => (
  <p className="text-base text-fg-secondary mt-1 font-medium text-center text-balance">
    {children}
  </p>
)

EmptyState.Title = Title
EmptyState.Description = Description

export default EmptyState
