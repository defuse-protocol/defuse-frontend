"use client"

import { ShieldCheckIcon } from "@phosphor-icons/react"
import { ExternalLinkIcon } from "@radix-ui/react-icons"
import { Popover, Separator, Switch, Text } from "@radix-ui/themes"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import Themes from "@src/types/themes"
import { useTheme } from "next-themes"
import { useContext } from "react"
import AddTurboChainButton from "./AddTurboChainButton"

const Settings = () => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const elementCircleStyle =
    "bg-black w-[3px] h-[3px] rounded-full dark:bg-gray-100"
  return (
    <div>
      <Popover.Root>
        <Popover.Trigger>
          <button
            type={"button"}
            className="w-[32px] h-[32px] flex justify-center items-center rounded-full gap-1 bg-gray-a3"
          >
            <span className={elementCircleStyle} />
            <span className={elementCircleStyle} />
            <span className={elementCircleStyle} />
          </button>
        </Popover.Trigger>
        <Popover.Content className="min-w-[180px] mt-1 dark:bg-black-800 rounded-2xl">
          <div className="flex flex-col gap-4">
            {whitelabelTemplate === "turboswap" && (
              <div className="md:hidden">
                <AddTurboChainButton />
                <Separator orientation="horizontal" size="4" className="mt-4" />
              </div>
            )}

            <DarkMode />
            <Separator orientation="horizontal" size="4" />

            <div className="flex flex-col justify-between items-center gap-1.5">
              <a
                href="https://docs.near-intents.org"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex justify-between items-center gap-2"
              >
                <Text size="2" weight="medium">
                  Docs
                </Text>
                <ExternalLinkIcon width={16} height={16} />
              </a>

              <a
                href="https://t.me/near_intents"
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
                href="mailto:defuse@defuse.org"
                className="w-full flex justify-between items-center gap-2"
              >
                <Text size="2" weight="medium">
                  Request feature
                </Text>
                <ExternalLinkIcon width={16} height={16} />
              </a>

              <a
                href="/privacy-policy"
                className="w-full flex justify-between items-center gap-2"
              >
                <Text size="2" weight="medium">
                  Privacy Policy
                </Text>
              </a>

              <a
                href="/terms-of-service"
                className="w-full flex justify-between items-center gap-2"
              >
                <Text size="2" weight="medium">
                  Terms of Service
                </Text>
              </a>
              {whitelabelTemplate === "near-intents" && (
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
              )}
            </div>

            <Separator orientation="horizontal" size="4" />
            <div className="flex flex-col justify-between items-center gap-1.5">
              <a
                href="https://hackenproof.com/programs/near-intents"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex justify-between items-center gap-2"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheckIcon
                    className="w-4 h-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Text size="2" weight="medium">
                    Bug Bounty
                  </Text>
                </span>
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
  const { setTheme, resolvedTheme } = useTheme()

  // This accounts for system preference when theme is set to "system"
  const isDarkMode = resolvedTheme === Themes.DARK

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
        checked={isDarkMode}
      />
    </div>
  )

  return darkModeSwitch
}

export default Settings
