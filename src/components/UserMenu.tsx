"use client"

import {
  ArrowRightStartOnRectangleIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronUpIcon,
  // Cog8ToothIcon,
  DocumentDuplicateIcon,
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/16/solid"
import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { UserIcon } from "@heroicons/react/24/solid"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useActivityDock } from "@src/providers/ActivityDockProvider"
import clsx from "clsx"
import Link from "next/link"
import { DropdownMenu } from "radix-ui"
import { useState } from "react"
import AlertDialog from "./AlertDialog"
import Button from "./Button"
import { midTruncate } from "./DefuseSDK/features/withdraw/components/WithdrawForm/utils"

type MenuItemType = {
  label: string
  onClick?: () => void
  href?: string
  icon: React.ComponentType<{ className?: string }>
  preventClose?: boolean
}

const COPY_ADDRESS_WARNING_ACK_KEY = "defuse.copyAddressWarning.ack"

const UserMenu = ({
  variant,
}: {
  variant: "desktop" | "mobile"
}) => {
  const { dockItems, clearDockItems } = useActivityDock()
  const hasDockItems = dockItems.length > 0
  const { state, signOut } = useConnectWallet()
  const [copied, setCopied] = useState(false)
  const [isCopyWarningOpen, setIsCopyWarningOpen] = useState(false)
  const displayLabel = "My account"

  const [skipCopyWarning, setSkipCopyWarning] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(COPY_ADDRESS_WARNING_ACK_KEY) === "true"
  })

  const handleCopyAddress = async () => {
    if (state.address) {
      await navigator.clipboard.writeText(state.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const items: MenuItemType[] = [
    {
      label: "Sign out",
      onClick: () => {
        if (state.chainType) {
          clearDockItems()
          signOut({ id: state.chainType })
        }
      },
      icon: ArrowRightStartOnRectangleIcon,
    },
    // {
    //   label: "Settings",
    //   href: "/settings",
    //   icon: Cog8ToothIcon,
    // },
    {
      label: "Support",
      onClick: () => {
        if (typeof window !== "undefined" && window.Beacon) {
          window.Beacon("open")
        }
      },
      icon: QuestionMarkCircleIcon,
    },
    {
      label: copied ? "Copied!" : "Copy account address",
      onClick: () => {
        if (skipCopyWarning) {
          handleCopyAddress()
          return
        }
        setIsCopyWarningOpen(true)
      },
      icon: copied ? CheckIcon : DocumentDuplicateIcon,
      preventClose: true,
    },
  ]

  return (
    <>
      {variant === "desktop" ? (
        <DropdownMenu.Root modal={false}>
          <DropdownMenu.Trigger className="max-lg:hidden relative group bg-gray-900 rounded-2xl px-3.5 py-3 flex items-center gap-3 w-full hover:bg-gray-950 hover:text-gray-300 data-[state=open]:bg-gray-950 data-[state=open]:text-gray-300">
            <div className="shrink-0 size-7 flex items-center justify-center bg-brand rounded-lg">
              <UserIcon className="text-white/80 size-5" />
            </div>

            <div className="grow text-left">
              <div className="text-gray-300 text-sm/4 font-semibold">
                {displayLabel}
              </div>
              {state.address && (
                <div className="text-xs text-gray-400 flex min-w-0 font-medium">
                  {midTruncate(state.address)}
                </div>
              )}
            </div>

            <ChevronUpIcon className="size-5 shrink-0 group-data-[state=open]:rotate-180 transition-transform duration-100 ease-in-out" />
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={8}
              className="max-lg:hidden min-w-66 flex flex-col gap-1 rounded-2xl p-1.5 isolate bg-white outline outline-transparent focus:outline-hidden shadow-[0_-10px_15px_-3px_rgb(0_0_0/0.1),0_-4px_6px_-4px_rgb(0_0_0/0.1)] ring-1 ring-gray-900/10 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:duration-100 data-[state=closed]:ease-in"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {items.map((item) => (
                <MenuItem key={item.label} {...item} variant="desktop" />
              ))}

              {/* <div className="rounded-xl p-2.5 text-left text-sm text-gray-700 flex items-center gap-2 font-semibold">
            <ShieldCheckIconSmall className="size-4 text-gray-500 group-hover:text-gray-600 group-focus:text-gray-600" />
            <span className="grow">Shield mode</span>
            <Switch.Root
              checked={isShielded}
              onCheckedChange={setShielded}
              className="group relative flex h-5 bg-gray-300 w-12 cursor-pointer rounded-lg p-1 focus:not-data-focus:outline-none data-[state=checked]:bg-brand data-focus:outline data-focus:outline-white transition-colors duration-200 ease-in-out"
              aria-label="Toggle Shield Mode"
            >
              <Switch.Thumb className="pointer-events-none inline-block h-3 w-4 translate-x-0 rounded bg-white shadow-lg ring-0 transition duration-200 ease-in-out data-[state=checked]:translate-x-6" />
            </Switch.Root>
          </div> */}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ) : (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="lg:hidden relative group text-gray-400 rounded-xl -mr-1.5 px-2.5 py-1.5 flex items-center gap-2.5 data-[state=open]:bg-gray-950 data-[state=open]:text-gray-300 focus-visible:outline-none">
            <div
              className={clsx(
                "text-sm font-semibold grow text-right ml-1",
                hasDockItems && "hidden"
              )}
            >
              {displayLabel}
            </div>

            <div className="size-6 flex items-center justify-center bg-brand rounded-md">
              <UserIcon className="text-white/80 size-4" />
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="bottom"
              align="end"
              sideOffset={2}
              className={clsx(
                "lg:hidden flex flex-col-reverse gap-1 bg-white rounded-2xl shadow-xl p-1.5 space-y-1 min-w-56 origin-top-right duration-100 ring-1 ring-gray-900/10",

                "data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2 fade-in data-[state=open]:ease-out data-[state=open]:zoom-in-97",

                "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2 fade-out data-[state=closed]:ease-in data-[state=closed]:zoom-out-97"
              )}
            >
              <DropdownMenu.Arrow className="fill-white" />
              {items.map((item) => (
                <MenuItem key={item.label} {...item} variant="mobile" />
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}

      <AlertDialog open={isCopyWarningOpen}>
        <div className="flex flex-col items-center mt-4">
          <div className="bg-gray-100 size-13 rounded-full flex justify-center items-center">
            <InformationCircleIcon className="size-6 text-gray-500" />
          </div>
          <AlertDialog.Title className="mt-5">
            Before you copy this address
          </AlertDialog.Title>
        </div>

        <ul className="bg-gray-50 rounded-3xl p-5 mt-5 space-y-3">
          <li className="flex items-start gap-1.5">
            <CheckCircleIcon className="size-4 text-gray-600 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600 font-medium">
              This is your NEAR Intents internal address
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <ExclamationCircleIcon className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600 font-medium">
              Use it only for transfers between NEAR Intents accounts
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <ExclamationCircleIcon className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600 font-medium">
              Funds sent here from external wallets will be lost
            </span>
          </li>
        </ul>

        <div className="mt-5 flex flex-col gap-2">
          <Button
            size="xl"
            fullWidth
            onClick={() => {
              localStorage.setItem(
                COPY_ADDRESS_WARNING_ACK_KEY,
                String(skipCopyWarning)
              )
              handleCopyAddress()
              setIsCopyWarningOpen(false)
            }}
          >
            I understand, copy address
          </Button>
          <label className="p-2.5 flex items-center justify-center self-center gap-2 text-sm text-gray-600 font-medium">
            <input
              type="checkbox"
              checked={skipCopyWarning}
              onChange={(e) => setSkipCopyWarning(e.target.checked)}
              className="text-gray-600 size-4 rounded bg-white border-gray-300 checked:bg-gray-600 checked:border-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 ring-0 ring-transparent ring-offset-gray-50"
            />
            Don't show again on this device
          </label>
        </div>
      </AlertDialog>
    </>
  )
}

export default UserMenu

const MenuItem = ({
  href,
  onClick,
  icon: Icon,
  label,
  preventClose,
  variant,
}: MenuItemType & { variant: "desktop" | "mobile" }) => {
  const classes = clsx(
    "group rounded-xl text-left text-sm font-semibold text-gray-700 flex items-center gap-2",
    {
      "p-2.5 focus:outline-hidden focus-visible:bg-gray-200 focus-visible:text-gray-900 hover:bg-gray-200 hover:text-gray-900":
        variant === "desktop",
      "py-2.5 px-3": variant === "mobile",
    }
  )

  const content = (
    <>
      <Icon
        className={clsx({
          "size-4 text-gray-500 group-hover:text-gray-600 group-focus:text-gray-600":
            variant === "desktop",
          "size-4 shrink-0 text-gray-500": variant === "mobile",
        })}
      />
      <span>{label}</span>
    </>
  )

  return (
    <DropdownMenu.Item
      key={label}
      asChild
      onSelect={preventClose ? (e) => e.preventDefault() : undefined}
    >
      {href ? (
        <Link href={href} className={classes}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={classes}>
          {content}
        </button>
      )}
    </DropdownMenu.Item>
  )
}
