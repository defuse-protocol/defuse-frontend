"use client"

import { ExternalLinkIcon } from "@radix-ui/react-icons"
import { Popover, Separator, Switch, Text } from "@radix-ui/themes"
import { useTheme } from "next-themes"

import Themes from "@src/types/themes"
import ComingSoon from "./ComingSoon"
import LabelNew from "./LabelNew"

const NEXT_PUBLIC_LINK_DOCS = process.env.NEXT_PUBLIC_LINK_DOCS ?? ""
const NEXT_PUBLIC_PUBLIC_MAIL = process?.env?.NEXT_PUBLIC_PUBLIC_MAIL ?? ""
const NEXT_PUBLIC_PUBLIC_TG = process?.env?.NEXT_PUBLIC_PUBLIC_TG ?? ""

const Settings = () => {
  const elementCircleStyle =
    "bg-black w-[3px] h-[3px] rounded-full dark:bg-gray-100"
  return (
    <div>
      <Popover.Root>
        <Popover.Trigger>
          <button
            type={"button"}
            className="w-[32px] h-[32px] flex justify-center items-center bg-gray-200 rounded-full gap-1 dark:bg-gray-1000"
          >
            <span className={elementCircleStyle} />
            <span className={elementCircleStyle} />
            <span className={elementCircleStyle} />
          </button>
        </Popover.Trigger>
        <Popover.Content className="min-w-[180px] mt-1 dark:bg-black-800 rounded-2xl">
          <div className="flex flex-col gap-4">
            <DarkMode />
            <Separator orientation="horizontal" size="4" />
            <div className="flex flex-col justify-between items-center gap-1.5">
              <a
                href={NEXT_PUBLIC_LINK_DOCS}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex justify-between items-center gap-2"
              >
                <Text size="2" weight="medium">
                  Help center
                </Text>
                <ExternalLinkIcon width={16} height={16} />
              </a>
              <a
                href={`mailto:${NEXT_PUBLIC_PUBLIC_MAIL}`}
                className="w-full flex justify-between items-center gap-2"
              >
                <Text size="2" weight="medium">
                  Request feature
                </Text>
                <ExternalLinkIcon width={16} height={16} />
              </a>
              <LabelNew className="right-1/2">
                <a
                  href={NEXT_PUBLIC_PUBLIC_TG}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex justify-between items-center gap-2"
                >
                  <Text size="2" weight="medium">
                    Telegram
                  </Text>
                  <ExternalLinkIcon width={16} height={16} />
                </a>
              </LabelNew>
              <a
                href="/jobs"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex justify-between items-center gap-2"
              >
                <Text size="2" weight="medium">
                  Jobs
                </Text>
                <ExternalLinkIcon width={16} height={16} />
              </a>
            </div>
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  )
}

const DarkMode = () => {
  const { theme, setTheme } = useTheme()

  const darkModeSwitch = (
    <div className="flex justify-between items-center gap-4">
      <Text size="2" weight="medium">
        Dark Mode
      </Text>
      <Switch
        className="cursor-pointer"
        size="1"
        onCheckedChange={(checked: boolean) => {
          setTheme(checked ? Themes.DARK : Themes.LIGHT)
        }}
        defaultChecked={theme === Themes.DARK}
      />
    </div>
  )

  return <ComingSoon className="top-[0.25rem]">{darkModeSwitch}</ComingSoon>
}

export default Settings
