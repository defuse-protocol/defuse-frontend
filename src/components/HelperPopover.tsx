import { QuestionMarkCircleIcon } from "@heroicons/react/16/solid"
import clsx from "clsx"
import { Popover } from "radix-ui"
import type { ReactNode } from "react"

const HelperPopover = ({ children }: { children: ReactNode }) => {
  if (!children) return null

  return (
    <Popover.Root>
      <Popover.Trigger className="size-7 shrink-0 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors bg-transparent hover:bg-gray-100 rounded-lg focus-visible:outline-none focus-visible:bg-gray-100 focus-visible:text-gray-700 data-[state=open]:bg-gray-100 data-[state=open]:text-gray-700">
        <QuestionMarkCircleIcon className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={clsx(
            "max-w-80 bg-gray-900 rounded-2xl shadow-xl px-3 py-2 origin-top flex flex-col gap-2.5 text-gray-200 text-sm/5 font-medium text-pretty",

            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:duration-100 data-[state=open]:ease-out",

            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:duration-75 data-[state=closed]:ease-in"
          )}
          sideOffset={5}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default HelperPopover
