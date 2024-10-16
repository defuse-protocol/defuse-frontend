"use client"

import React, { useState, useEffect } from "react"
import { Popover, Spinner, Switch, Text, Separator } from "@radix-ui/themes"
import { useTheme } from "next-themes"
import { ExternalLinkIcon } from "@radix-ui/react-icons"

import Themes from "@src/types/themes"
import { THEME_MODE_KEY } from "@src/constants/contracts"

const NEXT_PUBLIC_LINK_DOCS = process.env.NEXT_PUBLIC_LINK_DOCS ?? ""
const NEXT_PUBLIC_PUBLIC_MAIL = process?.env?.NEXT_PUBLIC_PUBLIC_MAIL ?? ""

const Settings = () => {
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const getThemeFromLocal = localStorage.getItem(THEME_MODE_KEY)
    if (!getThemeFromLocal) {
      setTheme(Themes.LIGHT)
      return
    }
    if (getThemeFromLocal === "light" || getThemeFromLocal === "dark") {
      setTheme(getThemeFromLocal)
    }
  }, [])

  const onChangeTheme = () => {
    setTheme(theme === Themes.DARK ? Themes.LIGHT : Themes.DARK)
  }

  const elementCircleStyle =
    "bg-black w-[3px] h-[3px] rounded-full dark:bg-gray-100"
  return (
    <div>
      <Popover.Root>
        <Popover.Trigger>
          <button className="w-[32px] h-[32px] flex justify-center items-center bg-gray-200 rounded-full gap-1 dark:bg-gray-1000">
            <span className={elementCircleStyle}></span>
            <span className={elementCircleStyle}></span>
            <span className={elementCircleStyle}></span>
          </button>
        </Popover.Trigger>
        <Popover.Content className="min-w-[180px] mt-1 dark:bg-black-800 rounded-2xl">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center gap-4">
              <Text size="2" weight="medium">
                Dark Mode
              </Text>
              <Switch
                className="cursor-pointer"
                size="1"
                onClick={onChangeTheme}
                color="orange"
                defaultChecked={theme === Themes.DARK}
              />
            </div>
            <Separator orientation="horizontal" size="4" />
            <div className="flex flex-col justify-between items-center gap-1.5">
              <button
                onClick={() => window.open(NEXT_PUBLIC_LINK_DOCS)}
                className="w-full flex justify-between items-center gap-2"
              >
                <Text size="2" weight="medium">
                  Help center
                </Text>
                <ExternalLinkIcon width={16} height={16} />
              </button>
              <button
                onClick={() => window.open(`mailto:${NEXT_PUBLIC_PUBLIC_MAIL}`)}
                className="w-full flex justify-between items-center gap-2"
              >
                <Text size="2" weight="medium">
                  Request feature
                </Text>
                <ExternalLinkIcon width={16} height={16} />
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  )
}

export default Settings
