import { ChevronDownIcon } from "@heroicons/react/16/solid"
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
  dataTestId?: string
}

function ListItem({
  children,
  popoverContent,
  onClick,
  highlight = false,
  className,
  dataTestId,
}: ListItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasPopover = popoverContent !== undefined
  const isInteractive = hasPopover || onClick !== undefined

  const content = (
    <div
      className={clsx(
        "relative -mx-4 px-4 rounded-2xl group",
        highlight && "bg-gray-100",
        isInteractive && (isOpen ? "bg-gray-100" : "hover:bg-gray-100"),
        className
      )}
      data-testid={dataTestId}
    >
      <div className="relative flex gap-3 items-center py-3">
        <div className="flex-1 min-w-0 flex gap-3 items-center">{children}</div>
        {hasPopover && (
          <ChevronDownIcon
            className={clsx(
              "size-5 text-gray-500 shrink-0 group-hover:text-gray-900 transition-transform duration-100",
              isOpen && "text-gray-900 rotate-180"
            )}
          />
        )}
      </div>

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
          className="absolute z-10 inset-0 rounded-2xl group"
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
          className="bg-gray-900 rounded-xl shadow-lg flex p-1 gap-1"
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
  className,
  children,
}: {
  align?: "start" | "end"
  className?: string
  children: ReactNode
}) => (
  <div
    className={clsx(
      "flex flex-col gap-0.5",
      align === "start" ? "items-start flex-1 min-w-0" : "items-end text-right",
      className
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
    className={clsx(
      "text-base/5 font-semibold text-gray-900 max-w-full",
      className
    )}
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
  <div className={cn("text-sm/4 font-medium text-gray-500", className)}>
    {children}
  </div>
)

ListItem.Content = Content
ListItem.Title = Title
ListItem.Subtitle = Subtitle

export default ListItem
