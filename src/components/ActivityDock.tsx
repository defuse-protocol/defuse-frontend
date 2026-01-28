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
import { type Variants, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import Button from "./Button"

const STACK_OFFSET = 10 // how much of each background card's top edge peeks out
const CARD_GAP = 12 // gap between cards when expanded

const ActivityDock = () => {
  const { dockItems, removeDockItem } = useActivityDock()
  const [expanded, setExpanded] = useState(false)
  const [topCardHeight, setTopCardHeight] = useState<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom (which is scrollTop=0 with flex-col-reverse) when collapsing
  useEffect(() => {
    if (!expanded && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [expanded])

  if (dockItems.length === 0) return <div className="flex-1" />

  const showExpandButton = dockItems.length > 1

  return (
    <>
      <motion.div
        ref={scrollContainerRef}
        className={clsx(
          "relative mt-3 flex-1 flex flex-col-reverse min-h-0 hide-scrollbar transition-colors duration-300",
          expanded
            ? "overflow-y-auto bg-gray-600 px-2 -mx-2 outline-1 outline-gray-500 rounded-3xl"
            : "overflow-hidden rounded-2xl"
        )}
        animate={{
          paddingTop: expanded ? 8 : 0,
          paddingBottom: expanded ? 8 : 0,
        }}
        transition={{ type: "spring", stiffness: 600, damping: 50 }}
      >
        <div className="relative flex flex-col" style={{ gap: CARD_GAP }}>
          {[...dockItems].reverse().map((item) => {
            const index = dockItems.indexOf(item)
            return (
              <DockCard
                key={item.id}
                item={item}
                index={index}
                expanded={expanded}
                topCardHeight={topCardHeight}
                onHeightChange={index === 0 ? setTopCardHeight : undefined}
                onDismiss={removeDockItem}
              />
            )
          })}
        </div>
      </motion.div>

      {showExpandButton && (
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDoubleDownIcon className="size-4" />
          ) : (
            <ChevronDoubleUpIcon className="size-4" />
          )}
          {expanded ? "Collapse" : "Expand"}
        </Button>
      )}
    </>
  )
}

function DockCard({
  item,
  index,
  expanded,
  topCardHeight,
  onHeightChange,
  onDismiss,
}: {
  item: DockItem
  index: number
  expanded: boolean
  topCardHeight: number | null
  onHeightChange?: (height: number) => void
  onDismiss: (id: string) => void
}) {
  const containerCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!onHeightChange || !containerCardRef.current) return

    const measureHeight = () => {
      if (!containerCardRef.current) return

      onHeightChange(containerCardRef.current.offsetHeight)
    }

    measureHeight()

    const resizeObserver = new ResizeObserver(measureHeight)
    resizeObserver.observe(containerCardRef.current)

    return () => resizeObserver.disconnect()
  }, [onHeightChange])

  const isTopCard = index === 0
  const cardHeight = topCardHeight ?? 0
  const collapsedY = index * (cardHeight + CARD_GAP) - index * STACK_OFFSET

  const variants: Variants = {
    open: {
      y: 0,
      scale: 1,
      opacity: 1,
      height: "auto",
      pointerEvents: "auto",
    },
    closed: {
      y: collapsedY,
      scale: 1 - index * 0.05,
      opacity: 1 - index * 0.3,
      height: !isTopCard && topCardHeight ? topCardHeight : "auto",
      pointerEvents: isTopCard ? "auto" : "none",
    },
  }

  return (
    <motion.div
      ref={containerCardRef}
      className="bg-white rounded-2xl outline-1 -outline-offset-1 outline-gray-900/10 shadow w-full overflow-hidden"
      style={{
        zIndex: 10 - index,
      }}
      variants={variants}
      animate={expanded ? "open" : "closed"}
      transition={{
        type: "spring",
        stiffness: 600,
        damping: 50,
        delay: index * 0.04,
      }}
    >
      <div className="p-3">
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
    </motion.div>
  )
}

export default ActivityDock
