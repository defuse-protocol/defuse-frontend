"use client"

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import { useActivityDock } from "@src/providers/ActivityDockProvider"
import clsx from "clsx"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import Button from "./Button"

const MAX_VISIBLE = 3
const ACTIVE_DISMISS_DELAY_MS = 5_000
const SETTLED_AUTO_DISMISS_DELAY_MS = 60_000
const COUNTDOWN_SECONDS = 5

const ActivityDock = () => {
  const { dockItems, removeDockItem } = useActivityDock()
  const [dismissEligible, setDismissEligible] = useState<Set<string>>(
    () => new Set()
  )
  const [countdowns, setCountdowns] = useState<Map<string, number>>(
    () => new Map()
  )
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  )
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(
    new Map()
  )
  const settledIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const timers = timersRef.current
    const intervals = intervalsRef.current
    const settledIds = settledIdsRef.current

    for (const item of dockItems) {
      if (item.isSettled) {
        if (settledIds.has(item.id)) continue
        settledIds.add(item.id)

        const existingTimer = timers.get(item.id)
        if (existingTimer) {
          clearTimeout(existingTimer)
          timers.delete(item.id)
        }

        const timer = setTimeout(() => {
          timers.delete(item.id)
          setCountdowns((prev) => new Map(prev).set(item.id, COUNTDOWN_SECONDS))
          const interval = setInterval(() => {
            setCountdowns((prev) => {
              const current = prev.get(item.id)
              if (current == null || current <= 1) {
                clearInterval(intervals.get(item.id))
                intervals.delete(item.id)
                removeDockItem(item.id)
                const next = new Map(prev)
                next.delete(item.id)
                return next
              }
              return new Map(prev).set(item.id, current - 1)
            })
          }, 1000)
          intervals.set(item.id, interval)
        }, SETTLED_AUTO_DISMISS_DELAY_MS)
        timers.set(item.id, timer)
      } else {
        if (timers.has(item.id)) continue
        const timer = setTimeout(() => {
          setDismissEligible((prev) => new Set(prev).add(item.id))
          timers.delete(item.id)
        }, ACTIVE_DISMISS_DELAY_MS)
        timers.set(item.id, timer)
      }
    }

    for (const [id, timer] of timers) {
      if (!dockItems.some((item) => item.id === id)) {
        clearTimeout(timer)
        timers.delete(id)
        settledIds.delete(id)
        const interval = intervals.get(id)
        if (interval) {
          clearInterval(interval)
          intervals.delete(id)
        }
      }
    }
  }, [dockItems, removeDockItem])

  useEffect(() => {
    const timers = timersRef.current
    const intervals = intervalsRef.current
    return () => {
      for (const timer of timers.values()) clearTimeout(timer)
      for (const interval of intervals.values()) clearInterval(interval)
    }
  }, [])

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

              {(item.isSettled || dismissEligible.has(item.id)) && (
                <Button
                  onClick={() => removeDockItem(item.id)}
                  variant="secondary"
                  className="border border-gray-200"
                  fullWidth
                >
                  {countdowns.has(item.id) ? (
                    <span className="tabular-nums">
                      Dismissing in {countdowns.get(item.id)}
                    </span>
                  ) : (
                    "Dismiss"
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ActivityDock
