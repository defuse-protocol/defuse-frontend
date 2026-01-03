import * as Popover from "@radix-ui/react-popover"
import { cn } from "@src/utils/cn"
import clsx from "clsx"
import { type ReactNode, useState } from "react"

type ListItemProps = {
  children: ReactNode
  popoverContent?: ReactNode
  onClick?: () => void
  highlight?: boolean
  className?: string
}

function ListItem({
  children,
  popoverContent,
  onClick,
  highlight = false,
  className,
}: ListItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasPopover = popoverContent !== undefined
  const isInteractive = hasPopover || onClick !== undefined

  const content = (
    <div
      className={clsx(
        "relative -mx-4 px-4 rounded-2xl",
        highlight && "bg-gray-100",
        isInteractive && (isOpen ? "bg-gray-100" : "hover:bg-gray-100"),
        className
      )}
    >
      <div className="relative flex gap-3 items-center py-3">{children}</div>

      {isInteractive && !hasPopover && (
        <button
          type="button"
          onClick={onClick}
          className="absolute z-10 inset-0 rounded-2xl"
          aria-label="Select item"
        />
      )}
      {hasPopover && (
        <Popover.Trigger
          type="button"
          className="absolute z-10 inset-0 rounded-2xl"
          aria-label="Open menu"
        />
      )}
    </div>
  )

  if (!hasPopover) return content

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      {content}
      <Popover.Portal>
        <Popover.Content
          className={clsx(
            "bg-gray-900 rounded-xl shadow-lg flex p-1 gap-1",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:duration-100 data-[state=closed]:ease-in"
          )}
          sideOffset={-5}
        >
          <Popover.Arrow />
          {popoverContent}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

const Content = ({
  align = "start",
  children,
}: {
  align?: "start" | "end"
  children: ReactNode
}) => (
  <div
    className={clsx(
      "flex flex-col gap-1",
      align === "start" ? "items-start flex-1" : "items-end text-right"
    )}
  >
    {children}
  </div>
)

const Title = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <div
    className={clsx("text-base/none font-semibold text-gray-900", className)}
  >
    {children}
  </div>
)

const Subtitle = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <div className={cn("text-sm/none font-medium text-gray-500", className)}>
    {children}
  </div>
)

ListItem.Content = Content
ListItem.Title = Title
ListItem.Subtitle = Subtitle

export default ListItem
