"use client"

import { ArrowTopRightOnSquareIcon, TrashIcon } from "@heroicons/react/16/solid"
import {
  type DockItem,
  useActivityDock,
} from "@src/providers/ActivityDockProvider"
import clsx from "clsx"
import { AnimatePresence, type Variants, motion } from "framer-motion"
import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react"
import Button from "./Button"

const STACK_OFFSET = 14
const MAX_VISIBLE_STACK = 3

const ActivityDock = () => {
  const { dockItems, clearDockItems } = useActivityDock()
  const [expanded, setExpanded] = useState(false)
  const [topCardHeight, setTopCardHeight] = useState<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const canExpand = dockItems.length > 1

  useEffect(() => {
    if (!expanded && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
      })
    }
  }, [expanded])

  useEffect(() => {
    if (expanded && dockItems.length <= 1) {
      setExpanded(false)
    }
  }, [expanded, dockItems])

  const handleMouseEnterCard = () => {
    if (canExpand) {
      setExpanded(true)
    }
  }

  const handleMouseLeaveContainer = () => {
    setExpanded(false)
  }

  return (
    <div
      className="relative mt-5 flex flex-col justify-end flex-1 overflow-hidden -mx-4"
      onMouseLeave={handleMouseLeaveContainer}
    >
      <motion.div
        ref={scrollContainerRef}
        className={clsx(
          "relative flex flex-col-reverse hide-scrollbar p-4 border-y",
          expanded
            ? "overflow-y-auto bg-white/10 border-white/15 transition-colors pt-1"
            : "overflow-hidden border-b-white/10 border-t-transparent"
        )}
      >
        {dockItems.length > 0 && (
          <Button
            variant="custom"
            type="button"
            size="sm"
            onClick={clearDockItems}
            className="self-center mt-4 bg-white/20 text-white outline-white hover:bg-white/30"
          >
            <TrashIcon className="size-4 shrink-0" />
            {dockItems.length > 1 ? "Clear all" : "Clear"}
          </Button>
        )}
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
                onMouseEnter={handleMouseEnterCard}
              />
            )
          })}
        </AnimatePresence>
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
  onMouseEnter,
}: {
  item: DockItem
  index: number
  totalCards: number
  expanded: boolean
  topCardHeight: number | null
  isTopCard: boolean
  onHeightChange?: (height: number) => void
  onMouseEnter?: () => void
}) {
  const containerCardRef = useRef<HTMLDivElement>(null)
  const isAnimatingRef = useRef(false)

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

  const handleMouseEnter = () => {
    if (isAnimatingRef.current) return
    onMouseEnter?.()
  }

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
      onMouseEnter={handleMouseEnter}
      onAnimationStart={() => {
        isAnimatingRef.current = true
      }}
      onAnimationComplete={() => {
        isAnimatingRef.current = false
      }}
    >
      <div className="pt-4" ref={containerCardRef}>
        <div
          className="bg-white rounded-2xl outline-1 -outline-offset-1 outline-gray-900/10 w-full p-3"
          style={{
            boxShadow:
              "0 -1px 3px 0 rgb(0 0 0 / 0.1), 0 -1px 2px -1px rgb(0 0 0 / 0.1)",
          }}
        >
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

          {item.explorerUrl && (
            <Button
              href={item.explorerUrl}
              variant="primary"
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              className="mt-4"
            >
              View on explorer
              <ArrowTopRightOnSquareIcon className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default ActivityDock
