import clsx from "clsx"

const Spinner = ({
  size = "md",
  className,
}: {
  size?: "sm" | "md"
  className?: string
}) => (
  <div
    className={clsx("animate-spin rounded-full border-current", className, {
      "size-3 border-[1.5px]": size === "sm",
      "size-4 border-2": size === "md",
    })}
    style={{ borderRightColor: "transparent" }}
  />
)

export default Spinner
