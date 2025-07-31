import clsx from "clsx"

export const EmptyIcon = ({ circle = false }: { circle?: boolean }) => {
  return (
    <div
      className={clsx("size-7 bg-gray-7", circle ? "rounded-full" : "rounded")}
    />
  )
}
