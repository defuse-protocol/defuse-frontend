import { QuestionMarkCircleIcon } from "@heroicons/react/16/solid"
import clsx from "clsx"
import { Popover } from "radix-ui"
import type { ReactNode } from "react"

type Props = {
  title: string
  subtitle?: string
  className?: string
  intro?: ReactNode
  children?: ReactNode
}

const PageHeader = ({ title, subtitle, className, intro, children }: Props) => (
  <div className={clsx("flex justify-between items-center gap-3", className)}>
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-gray-900 text-xl font-semibold tracking-tight">
          {title}
        </h1>

        {intro && (
          <Popover.Root>
            <Popover.Trigger className="size-7 shrink-0 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors bg-transparent hover:bg-gray-100 rounded-lg focus-visible:outline-none focus-visible:bg-gray-100 focus-visible:text-gray-700 data-[state=open]:bg-gray-100 data-[state=open]:text-gray-700">
              <QuestionMarkCircleIcon className="size-4" />
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className={clsx(
                  "max-w-80 bg-gray-900 rounded-2xl shadow-xl p-3 origin-top flex flex-col gap-2.5 text-gray-200 text-sm/5 font-medium",

                  "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:duration-100 data-[state=open]:ease-out",

                  "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:duration-75 data-[state=closed]:ease-in"
                )}
                sideOffset={5}
              >
                {intro}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-gray-500 text-sm font-medium">{subtitle}</p>
      )}
    </div>
    {children && <div>{children}</div>}
  </div>
)

export default PageHeader
