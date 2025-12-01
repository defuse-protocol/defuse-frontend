"use client"

import { authIdentity } from "@defuse-protocol/internal-utils"
import { ShieldCheckIcon } from "@phosphor-icons/react"
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react"
import { ExternalLinkIcon } from "@radix-ui/react-icons"
import { Button, Popover, Separator, Switch, Text } from "@radix-ui/themes"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import Themes from "@src/types/themes"
import { useTheme } from "next-themes"
import { useContext, useState } from "react"
import AddTurboChainButton from "./AddTurboChainButton"
import { RevealAddressDialog } from "./DefuseSDK/features/account/components/RevealAddressDialog"
import { IntentsIcon } from "./DefuseSDK/features/account/components/shared/IntentsIcon"
import { SystemStatus } from "./SystemStatus"

const Settings = () => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const elementCircleStyle =
    "bg-black w-[3px] h-[3px] rounded-full dark:bg-gray-100"

  const { state } = useConnectWallet()
  const { address: userAddress, chainType: userChainType } = state
  const internalUserAddress =
    userAddress != null && userChainType != null
      ? authIdentity.authHandleToIntentsUserId(userAddress, userChainType)
      : null

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

            {whitelabelTemplate !== "rabitswap" && (
              <>
                <DarkMode />
                <RevealAddress internalUserAddress={internalUserAddress} />
                <Separator orientation="horizontal" size="4" />
              </>
            )}

            <div className="flex flex-col justify-between items-center gap-1.5">
              <a
                href="https://explorer.near-intents.org"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex justify-between items-center gap-2"
              >
                <span className="flex items-center gap-2">
                  <Text size="2" weight="medium">
                    Explorer
                  </Text>
                  <span className="text-xs font-medium text-white bg-primary rounded-full px-2 py-0.5">
                    new
                  </span>
                </span>
                <ExternalLinkIcon width={16} height={16} />
              </a>

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

            <SystemStatus.Mobile />
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

const RevealAddress = ({
  internalUserAddress,
}: { internalUserAddress: string | null }) => {
  const [isRevealed, setIsRevealed] = useState(false)
  internalUserAddress

  return (
    <>
      {isRevealed && internalUserAddress != null && (
        <RevealAddressDialog
          internalUserAddress={internalUserAddress}
          onClose={() => setIsRevealed(false)}
        />
      )}
      <Button
        variant="soft"
        color="gray"
        radius="full"
        className="text-gray-12"
        onClick={() => setIsRevealed(true)}
      >
        <IntentsIcon className="rounded-full w-4 h-4" />
        Reveal Address{" "}
        {isRevealed ? (
          <EyeIcon weight="bold" />
        ) : (
          <EyeSlashIcon weight="bold" />
        )}
      </Button>
    </>
  )
}

export default Settings
