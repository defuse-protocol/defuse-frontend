"use client"

import {
  ArrowTopRightOnSquareIcon,
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
} from "@heroicons/react/16/solid"
import {
  type DockItem,
  useActivityDock,
} from "@src/providers/ActivityDockProvider"
import clsx from "clsx"
import { AnimatePresence, motion } from "framer-motion"
import { Dialog } from "radix-ui"
import { cloneElement, isValidElement, useEffect, useState } from "react"
import Button from "./Button"

const ActivityDockMobile = () => {
  const [open, setOpen] = useState(false)
  const { dockItems, removeDockItem } = useActivityDock()
  const hasDockItems = dockItems.length > 0

  useEffect(() => {
    if (!hasDockItems) {
      setOpen(false)
    }
  }, [hasDockItems])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className={clsx("", !hasDockItems && "hidden")}
        >
          Activity
          <ChevronDoubleDownIcon className="size-3 shrink-0" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className={clsx(
            "fixed inset-0 bg-gray-900/80 duration-200 backdrop-blur-sm",

            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:ease-out",

            "data-[state=closed]:animate-out data-[state=closed]:ease-in data-[state=closed]:fade-out"
          )}
        />

        <Dialog.Content
          className="fixed inset-0 z-10 w-screen overflow-y-auto"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Activity</Dialog.Title>
          <div
            role="presentation"
            className={clsx(
              "flex min-h-full items-start justify-center px-4 pt-safe-offset-3 pb-safe-offset-4 text-center sm:items-center sm:p-0"
            )}
            onClick={() => setOpen(false)}
            onKeyDown={() => {}}
          >
            <div
              role="presentation"
              className="relative transform overflow-hidden text-left transition-all w-full max-w-sm sm:my-8"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <div className="min-h-9 flex items-center justify-center mb-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Close
                  <ChevronDoubleUpIcon className="size-3 shrink-0" />
                </Button>
              </div>

              <AnimatePresence mode="popLayout" initial={false}>
                {dockItems.map((item, index) => (
                  <DockCard
                    key={item.id}
                    item={item}
                    isFirst={index === 0}
                    onDismiss={removeDockItem}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DockCard({
  item,
  onDismiss,
  isFirst,
}: {
  item: DockItem
  onDismiss: (id: string) => void
  isFirst: boolean
}) {
  return (
    <motion.div
      exit={{ opacity: 0, height: 0 }}
      transition={{
        duration: 0.2,
      }}
    >
      <div className={clsx(!isFirst && "pt-4!")}>
        <div className="bg-white rounded-2xl outline-1 -outline-offset-1 outline-gray-900/10 w-full p-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center shrink-0 -space-x-2.5">
              {item.icons.map((icon, idx) => {
                if (!isValidElement<{ className?: string }>(icon)) return null

                return cloneElement(icon, {
                  key: `${item.id}-icon-${idx}`,
                  className: clsx(
                    icon.props.className,
                    "rounded-full ring-2 ring-white"
                  ),
                })
              })}
            </div>
            <p className="flex-1 text-sm font-semibold text-gray-700">
              {item.title}
            </p>
          </div>

          {item.renderContent ? (
            <div className="mt-4">{item.renderContent()}</div>
          ) : (
            item.keyValueRows.length > 0 && (
              <dl className="mt-4 space-y-2 overflow-hidden">
                {item.keyValueRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <dt className="text-sm text-gray-500 font-medium whitespace-nowrap">
                      {row.label}
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900 whitespace-nowrap truncate">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )
          )}

          <div className="flex flex-col gap-2 mt-4">
            {item.explorerUrl && (
              <Button
                href={item.explorerUrl}
                variant="primary"
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
              >
                View on explorer
                <ArrowTopRightOnSquareIcon className="size-4" />
              </Button>
            )}

            <Button
              onClick={() => onDismiss(item.id)}
              variant="secondary"
              className="border border-gray-200"
              fullWidth
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ActivityDockMobile
