"use client"

import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { createContext, useContext, useState } from "react"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../utils/cn"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

const TooltipContext = createContext<{
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

export function Tooltip({
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Root> & {
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <TooltipProvider>
      <TooltipContext.Provider value={{ open, setOpen }}>
        <TooltipPrimitive.Root
          data-slot="tooltip"
          open={open}
          onOpenChange={setOpen}
          {...props}
        >
          {children}
        </TooltipPrimitive.Root>
      </TooltipContext.Provider>
    </TooltipProvider>
  )
}

export function TooltipTrigger({
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Trigger> & {
  children: ReactNode
}) {
  const context = useContext(TooltipContext)

  if (!context) {
    throw new Error("TooltipTrigger must be used within a Tooltip component")
  }

  const { open, setOpen } = context

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      onClick={(e) => {
        e.stopPropagation()
        setOpen(!open)
      }}
      {...props}
    >
      {children}
    </TooltipPrimitive.Trigger>
  )
}

export function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) animate-in text-balance rounded-md bg-black dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 text-xs data-[state=closed]:animate-out",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-black fill-black dark:bg-white dark:fill-white" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}
