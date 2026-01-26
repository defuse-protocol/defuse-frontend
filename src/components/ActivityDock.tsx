"use client"

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import {
  type DockItem,
  useActivityDock,
} from "@src/providers/ActivityDockProvider"
import clsx from "clsx"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import Button from "./Button"

const MAX_VISIBLE = 3
const ACTIVE_DISMISS_DELAY_MS = 5_000
const SETTLED_AUTO_DISMISS_DELAY_MS = 60_000
const COUNTDOWN_SECONDS = 5

function DismissButton({
  item,
  onDismiss,
}: { item: DockItem; onDismiss: (id: string) => void }) {
  const now = Date.now()
  const canDismiss =
    item.isSettled || now - item.createdAt > ACTIVE_DISMISS_DELAY_MS

  if (!canDismiss) return null

  const countdown = item.settledAt
    ? Math.max(
        0,
        COUNTDOWN_SECONDS -
          Math.floor(
            (now - item.settledAt - SETTLED_AUTO_DISMISS_DELAY_MS) / 1000
          )
      )
    : null

  const showCountdown = countdown !== null && countdown < COUNTDOWN_SECONDS

  return (
    <Button
      onClick={() => onDismiss(item.id)}
      variant="secondary"
      className="border border-gray-200"
      fullWidth
    >
      {showCountdown ? (
        <span className="tabular-nums">Dismissing in {countdown}</span>
      ) : (
        "Dismiss"
      )}
    </Button>
  )
}

const ActivityDock = () => {
  const { dockItems, removeDockItem } = useActivityDock()
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
      const now = Date.now()
      for (const item of dockItems) {
        if (item.settledAt) {
          const elapsed = now - item.settledAt
          if (
            elapsed >=
            SETTLED_AUTO_DISMISS_DELAY_MS + COUNTDOWN_SECONDS * 1000
          ) {
            removeDockItem(item.id)
          }
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [dockItems, removeDockItem])

  const activeItems = dockItems.filter((i) => !i.isSettled)
  const settledItems = dockItems.filter((i) => i.isSettled)

  let needsScroll: boolean
  let visibleIds: Set<string>

  if (activeItems.length >= MAX_VISIBLE) {
    visibleIds = new Set(activeItems.map((i) => i.id))
    needsScroll = activeItems.length > MAX_VISIBLE
  } else {
    const settledSlots = MAX_VISIBLE - activeItems.length
    const visibleSettled = settledItems.slice(-settledSlots)
    visibleIds = new Set([
      ...activeItems.map((i) => i.id),
      ...visibleSettled.map((i) => i.id),
    ])
    needsScroll = false
  }

  const visibleItems = dockItems.filter((i) => visibleIds.has(i.id)).reverse()

  return (
    <div
      className={clsx(
        "flex flex-col justify-end w-full mt-auto grow pb-32 gap-3",
        needsScroll &&
          "overflow-y-auto max-h-[calc(100svh-280px)] hide-scrollbar"
      )}
    >
      <AnimatePresence mode="popLayout">
        {visibleItems.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-white rounded-2xl p-3 overflow-hidden"
          >
            <div className="flex items-center gap-3">
              {item.rawIcon ? (
                <div className="size-8 shrink-0 flex items-center justify-center">
                  {item.icon}
                </div>
              ) : (
                <div className="size-8 shrink-0 rounded-full bg-gray-200 flex items-center justify-center outline-1 outline-gray-900/10 -outline-offset-1">
                  {item.icon}
                </div>
              )}
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

              <DismissButton item={item} onDismiss={removeDockItem} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ActivityDock
