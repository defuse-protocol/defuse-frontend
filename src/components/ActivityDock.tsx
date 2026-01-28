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
import { AnimatePresence, type Variants, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import Button from "./Button"

const STACK_OFFSET = 14
const MAX_VISIBLE_STACK = 3

const ActivityDock = () => {
  const { dockItems, removeDockItem } = useActivityDock()
  const [expanded, setExpanded] = useState(false)
  const [topCardHeight, setTopCardHeight] = useState<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!expanded && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
      })
    }
  }, [expanded])

  useEffect(() => {
    if (dockItems.length <= 1) {
      setExpanded(false)
    }
  }, [dockItems])

  const showExpandButton = dockItems.length > 1

  const buttonFadeAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { delay: 0.3 } },
    exit: { opacity: 0 },
  }

  return (
    <div className="relative mt-5 flex flex-col justify-end flex-1 overflow-hidden -mx-4">
      <motion.div
        ref={scrollContainerRef}
        className={clsx(
          "relative flex flex-col-reverse hide-scrollbar p-4 border-y",
          expanded
            ? "overflow-y-auto bg-gray-700 border-gray-600"
            : "overflow-hidden border-b-gray-700 border-t-transparent"
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {dockItems.map((item, index) => {
            const isTopCard = index === dockItems.length - 1

            return (
              <DockCard
                key={item.id}
                item={item}
                index={index}
                totalCards={dockItems.length}
                expanded={expanded}
                topCardHeight={topCardHeight}
                isTopCard={isTopCard}
                onHeightChange={isTopCard ? setTopCardHeight : undefined}
                onDismiss={removeDockItem}
              />
            )
          })}
        </AnimatePresence>
        {showExpandButton && !expanded && (
          <motion.div
            className="absolute z-10 flex items-center justify-center inset-x-0"
            {...buttonFadeAnimation}
            style={{
              bottom: topCardHeight ? topCardHeight + STACK_OFFSET + 20 : 270,
            }}
          >
            <Button
              onClick={() => setExpanded((prev) => !prev)}
              variant="secondary"
              size="sm"
            >
              <ChevronDoubleUpIcon className="size-4" />
              Expand
            </Button>
          </motion.div>
        )}
        {expanded && (
          <motion.div
            className="sticky top-0 flex items-center justify-center inset-x-0 z-10"
            {...buttonFadeAnimation}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(false)}
              className="shadow-lg"
            >
              <ChevronDoubleDownIcon className="size-4" />
              Collapse
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

function DockCard({
  item,
  index,
  totalCards,
  expanded,
  topCardHeight,
  isTopCard,
  onHeightChange,
  onDismiss,
}: {
  item: DockItem
  index: number
  totalCards: number
  expanded: boolean
  topCardHeight: number | null
  isTopCard: boolean
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

  const cardHeight = topCardHeight ?? 0
  const distanceFromTop = totalCards - 1 - index
  const visualDistance = Math.min(distanceFromTop, MAX_VISIBLE_STACK - 1)
  const collapsedY = index * cardHeight - visualDistance * STACK_OFFSET

  const variants: Variants = {
    expanded: {
      y: 0,
      scale: 1,
      height: "auto",
      pointerEvents: "auto",
    },
    collapsed: {
      y: collapsedY,
      scale: 1 - visualDistance * 0.05,
      height: !isTopCard && topCardHeight ? topCardHeight : "auto",
      pointerEvents: isTopCard ? "auto" : "none",
    },
  }

  const initialState = expanded
    ? { y: 0, scale: 1, height: "auto" }
    : {
        y: collapsedY,
        scale: 1 - visualDistance * 0.05,
        height: !isTopCard && topCardHeight ? topCardHeight : "auto",
      }

  const isInert = !expanded && !isTopCard

  return (
    <motion.div
      layout={expanded}
      initial={initialState}
      variants={variants}
      animate={expanded ? "expanded" : "collapsed"}
      exit={{
        opacity: 0,
        height: 0,
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 40,
        delay: visualDistance * 0.02,
      }}
      style={{
        zIndex: index,
      }}
      className="overflow-hidden rounded-2xl shrink-0"
      inert={isInert ? true : undefined}
    >
      <div className="pt-4" ref={containerCardRef}>
        <div
          className="bg-white rounded-2xl outline-1 -outline-offset-1 outline-gray-900/10 w-full p-3"
          style={{
            boxShadow:
              "0 -1px 3px 0 rgb(0 0 0 / 0.1), 0 -1px 2px -1px rgb(0 0 0 / 0.1)",
          }}
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

export default ActivityDock
