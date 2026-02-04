"use client"

import {
  ArrowRightStartOnRectangleIcon,
  CheckIcon,
  ChevronUpIcon,
  Cog8ToothIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/16/solid"
import { UserIcon } from "@heroicons/react/24/solid"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import clsx from "clsx"
import Link from "next/link"
import { AlertDialog, DropdownMenu } from "radix-ui"
import { useState } from "react"
import { midTruncate } from "./DefuseSDK/features/withdraw/components/WithdrawForm/utils"

const COPY_ADDRESS_WARNING_ACK_KEY = "defuse.copyAddressWarning.ack"

const UserMenu = () => {
  const { state, signOut } = useConnectWallet()
  const [copied, setCopied] = useState(false)
  const [isCopyWarningOpen, setIsCopyWarningOpen] = useState(false)
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

  const items = [
    {
      label: "Sign out",
      onClick: () => {
        if (state.chainType) {
          signOut({ id: state.chainType })
        }
      },
      icon: ArrowRightStartOnRectangleIcon,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Cog8ToothIcon,
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
    },
  ]

  return (
    <>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger className="relative mt-5 group bg-gray-900 text-gray-400 rounded-2xl px-3.5 py-3 flex items-center gap-3 w-full hover:bg-gray-950 hover:text-gray-300 data-[state=open]:bg-gray-950 data-[state=open]:text-gray-300">
          <div className="size-7 flex items-center justify-center bg-brand rounded-lg">
            <UserIcon className="text-white/80 size-5" />
          </div>

          <div className="text-sm font-semibold grow text-left">
            {midTruncate(state.displayAddress ?? "")}
          </div>

          <ChevronUpIcon className="size-5 shrink-0 group-data-[state=open]:rotate-180 transition-transform duration-100 ease-in-out" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={8}
            className={clsx(
              "min-w-66 flex flex-col gap-1 rounded-2xl p-1.5 isolate bg-white outline outline-transparent focus:outline-hidden shadow-[0_-10px_15px_-3px_rgb(0_0_0/0.1),0_-4px_6px_-4px_rgb(0_0_0/0.1)] ring-1 ring-gray-900/10",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:duration-100 data-[state=closed]:ease-in"
            )}
          >
            {items.map(({ href, onClick, icon: Icon, label }) => {
              const className =
                "group rounded-xl focus:outline-hidden focus-visible:bg-gray-200 focus-visible:text-gray-900 p-2.5 text-left text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-200 hover:text-gray-900 font-semibold"

              const content = (
                <>
                  <Icon className="size-4 text-gray-500 group-hover:text-gray-600 group-focus:text-gray-600" />
                  {label}
                </>
              )

              return (
                <DropdownMenu.Item key={label} asChild>
                  {href ? (
                    <Link href={href} className={className}>
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={onClick}
                      className={className}
                    >
                      {content}
                    </button>
                  )}
                </DropdownMenu.Item>
              )
            })}

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

      <AlertDialog.Root
        open={isCopyWarningOpen}
        onOpenChange={setIsCopyWarningOpen}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            className={clsx(
              "fixed inset-0 bg-gray-900/80 z-50",
              "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:duration-300 data-[state=open]:ease-out",
              "data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:ease-in data-[state=closed]:fade-out"
            )}
          />

          <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-start sm:p-0 lg:pl-74 sm:pt-[10vh]">
              <AlertDialog.Content
                className={clsx(
                  "relative w-full max-w-sm transform overflow-hidden rounded-3xl bg-white p-5 text-left shadow-xl",
                  "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 fade-in data-[state=open]:ease-out data-[state=open]:duration-200 data-[state=open]:zoom-in-97",
                  "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-2 fade-out data-[state=closed]:ease-in data-[state=closed]:duration-1000 data-[state=closed]:zoom-in-97"
                )}
              >
                <AlertDialog.Title className="text-xl/7 font-bold tracking-tight text-gray-900">
                  Before you copy this address
                </AlertDialog.Title>

                <ul className="mt-3 list-disc pl-5 space-y-2 text-sm text-gray-600 font-medium">
                  <li>This is your NEAR Intents internal address.</li>
                  <li>
                    Use it only for transfers between NEAR Intents accounts.
                  </li>
                  <li>Funds sent here from external wallets will be lost.</li>
                </ul>

                <label className="mt-4 flex items-center gap-2 text-sm text-gray-700 font-medium">
                  <input
                    type="checkbox"
                    checked={skipCopyWarning}
                    onChange={(e) => setSkipCopyWarning(e.target.checked)}
                    className="size-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                  />
                  Don't show again on this device
                </label>

                <div className="mt-5 flex flex-col gap-2">
                  <AlertDialog.Action asChild>
                    <button
                      type="button"
                      className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-950 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-400"
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
                    </button>
                  </AlertDialog.Action>
                  <AlertDialog.Cancel asChild>
                    <button
                      type="button"
                      className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-300"
                    >
                      Cancel
                    </button>
                  </AlertDialog.Cancel>
                </div>
              </AlertDialog.Content>
            </div>
          </div>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}

export default UserMenu
