import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Theme } from "@radix-ui/themes"
import * as React from "react"
import { useState } from "react"

import { cn } from "../utils/cn"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  return (
    <PopoverPrimitive.Portal>
      <Theme asChild>
        <PopoverPrimitive.Content
          ref={ref}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-50 w-72 rounded-md border border-border bg-gray-1 p-4 text-gray-12 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
          )}
          {...props}
        />
      </Theme>
    </PopoverPrimitive.Portal>
  )
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

const HoverPopover = ({
  trigger,
  children,
  className,
  align = "center",
  sideOffset = 4,
}: {
  trigger: React.ReactElement
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end"
  sideOffset?: number
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        asChild
      >
        {trigger}
      </PopoverTrigger>
      <PopoverPrimitive.Portal>
        <Theme asChild>
          <PopoverPrimitive.Content
            align={align}
            sideOffset={sideOffset}
            className={cn(
              "z-50 w-72 rounded-md border border-border bg-gray-1 p-4 text-gray-12 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
              className
            )}
          >
            {children}
            <PopoverPrimitive.Arrow className="fill-gray-1" />
          </PopoverPrimitive.Content>
        </Theme>
      </PopoverPrimitive.Portal>
    </Popover>
  )
}

export { Popover, PopoverTrigger, PopoverContent, HoverPopover }
