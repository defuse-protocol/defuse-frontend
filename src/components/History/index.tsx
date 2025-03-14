"use client"

import { Popover } from "@radix-ui/themes"
import React, { useCallback, useEffect } from "react"

import Widget from "@src/components/History/Widget"
import { useHistoryStore } from "@src/providers/HistoryStoreProvider"

import HistoryButton from "./HistoryButton"

const History = () => {
  const { active, openWidget, closeWidget, toggleWidget } = useHistoryStore(
    (state) => state
  )

  const handleOpenHistory = () => {
    if (!active) {
      return openWidget()
    }
    closeWidget()
  }

  const handleCloseModal = useCallback(() => {
    if (!open) closeWidget()
  }, [closeWidget])

  useEffect(() => {
    handleCloseModal()
  }, [handleCloseModal])

  return (
    <div className="fixed bottom-[20px] right-[20px]">
      <HistoryButton active={active} onClick={handleOpenHistory} />
      <Popover.Root open={active} onOpenChange={toggleWidget}>
        <Popover.Trigger>
          <span className="invisible" />
        </Popover.Trigger>
        <Popover.Content
          sideOffset={5}
          className="bottom-[36px] -left-[10px] md:bottom-[64px] md:right-[20px] w-screen md:w-[370px] rounded-2xl bg-white-100 shadow-card-multi dark:border-silver-300 dark:border dark:bg-black-900"
        >
          <Widget />
        </Popover.Content>
      </Popover.Root>
    </div>
  )
}

export default History
