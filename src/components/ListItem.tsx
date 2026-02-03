import { ChevronDownIcon } from "@heroicons/react/16/solid"
import { cn } from "@src/utils/cn"
import clsx from "clsx"
import { Popover } from "radix-ui"
import { type ComponentType, type ReactNode, useState } from "react"
import Button from "./Button"

type PopoverItem = {
  label: string
  href?: string
  onClick?: () => void
  icon: ComponentType<{ className?: string }>
}

type ListItemProps = {
  children: ReactNode
  popoverItems?: PopoverItem[]
  onClick?: () => void
  highlight?: boolean
  className?: string
  dataTestId?: string
}

function ListItem({
  children,
  popoverItems,
  onClick,
  highlight = false,
  className,
  dataTestId,
}: ListItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasPopover = popoverItems && popoverItems.length > 0
  const isInteractive = hasPopover || onClick !== undefined

  const content = (
    <div
      className={clsx(
        "relative -mx-4 px-4 rounded-2xl group",
        highlight && "bg-gray-100",
        isInteractive &&
          (isOpen
            ? "bg-gray-100"
            : "hover:bg-gray-100 focus-within:bg-gray-100"),
        className
      )}
      data-testid={dataTestId}
    >
      <div className="flex gap-3 items-center py-4">
        <div className="flex-1 min-w-0 flex gap-3 items-center">{children}</div>
        {hasPopover && (
          <ChevronDownIcon
            className={clsx(
              "size-5 shrink-0 text-gray-500 group-hover:text-gray-900 group-data-[state=open]:text-gray-900 transition-transform duration-100 ease-in-out",
              isOpen && "rotate-180"
            )}
          />
        )}
      </div>

      {isInteractive && !hasPopover && (
        <button
          type="button"
          onClick={onClick}
          className="absolute z-10 inset-0 rounded-2xl focus-visible:outline-none"
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
            "bg-gray-900 rounded-xl shadow-lg flex p-1 gap-1 origin-top",

            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1 data-[state=open]:duration-100 data-[state=open]:ease-out",

            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-75 data-[state=closed]:ease-in"
          )}
          sideOffset={-5}
        >
          <Popover.Arrow />

          {popoverItems.map(({ label, href, onClick, icon: Icon }) => {
            const isExternalLink = href && !href.startsWith("/")

            return (
              <Button
                key={label}
                size="sm"
                href={href}
                onClick={onClick}
                {...(isExternalLink
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Button>
            )
          })}
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
    className={cn(
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
    className={cn(
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
