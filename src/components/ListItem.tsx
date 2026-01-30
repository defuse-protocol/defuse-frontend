import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid"
import { cn } from "@src/utils/cn"
import clsx from "clsx"
import { DropdownMenu } from "radix-ui"
import { type ComponentType, type ReactNode, useState } from "react"
import Button from "./Button"

type DropdownMenuItem = {
  label: string
  href?: string
  onClick?: () => void
  icon: ComponentType<{ className?: string }>
}

type ListItemProps = {
  children: ReactNode
  dropdownMenuItems?: DropdownMenuItem[]
  onClick?: () => void
  highlight?: boolean
  className?: string
  dataTestId?: string
}

function ListItem({
  children,
  dropdownMenuItems,
  onClick,
  highlight = false,
  className,
  dataTestId,
}: ListItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasDropdownMenu = dropdownMenuItems && dropdownMenuItems.length > 0
  const isInteractive = hasDropdownMenu || onClick !== undefined

  const content = (
    <div
      className={clsx(
        "relative -mx-4 px-4 rounded-2xl",
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
        {hasDropdownMenu && (
          <DropdownMenu.Trigger
            className="size-6 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus-visible:outline-none data-[state=open]:text-gray-900"
            aria-label="Open menu"
          >
            <span className="absolute z-10 inset-0 rounded-2xl" />
            <EllipsisHorizontalIcon className="size-4" />
          </DropdownMenu.Trigger>
        )}
      </div>

      {isInteractive && !hasDropdownMenu && (
        <button
          type="button"
          onClick={onClick}
          className="absolute z-10 inset-0 rounded-2xl"
          aria-label="Select item"
        />
      )}
    </div>
  )

  if (!hasDropdownMenu) return content

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen} modal={false}>
      {content}
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={clsx(
            "bg-gray-900 rounded-xl shadow-lg flex flex-col p-1 gap-1 text-white min-w-28 mr-2 origin-top-left",

            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:duration-100 data-[state=open]:ease-out",

            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:duration-75 data-[state=closed]:ease-in"
          )}
          sideOffset={5}
          align="start"
        >
          {dropdownMenuItems.map(({ label, href, onClick, icon: Icon }) => {
            const isExternalLink = href && !href.startsWith("/")

            return (
              <DropdownMenu.Item key={label} asChild>
                <Button
                  size="sm"
                  href={href}
                  onClick={onClick}
                  align="start"
                  {...(isExternalLink
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Button>
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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
