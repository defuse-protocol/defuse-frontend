"use client"

import { ShieldCheckIcon } from "@heroicons/react/20/solid"
import {
  BtcIcon,
  EthIcon,
  SolIcon,
  UsdcIcon,
  UsdtIcon,
  ZecIcon,
} from "@src/icons"
import { useState } from "react"
import Button from "./Button"
import { BaseModalDialog } from "./DefuseSDK/components/Modal/ModalDialog"

const ShieldPromo = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="relative mt-12 bg-gray-800 rounded-3xl grid grid-cols-3 gap-4 group overflow-hidden">
        <div className="col-span-2 p-5 relative z-20">
          <div className="bg-brand/20 text-brand text-xs rounded-lg px-2 py-1 inline-block uppercase font-bold">
            Coming soon
          </div>
          <div className="mt-4 mb-1">
            <h3 className="text-xl/6 font-bold text-white tracking-tight">
              Shielded account
            </h3>
          </div>
          <p className="text-fg-tertiary text-sm text-balance font-medium">
            Your private vault. Deposit, swap, and transfer—visible only to you.
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-4"
            onClick={() => setOpen(true)}
          >
            Read more
          </Button>
        </div>

        <div className="relative" aria-hidden="true">
          <div className="absolute size-32 -bottom-16 -right-16 rounded-full bg-brand/80 blur-[75px] pointer-events-none" />

          <svg className="sr-only" aria-hidden="true">
            <defs>
              <filter id="pixelate">
                <feFlood x="2" y="2" height="1" width="1" />
                <feComposite width="4" height="4" />
                <feTile result="a" />
                <feComposite in="SourceGraphic" in2="a" operator="in" />
                <feMorphology operator="dilate" radius="2" />
              </filter>
            </defs>
          </svg>
          <EthIcon className="size-9 absolute top-5 right-26 filter-[url(#pixelate)]" />
          <ZecIcon className="size-7 absolute top-8 right-8 filter-[url(#pixelate)]" />
          <UsdcIcon className="size-8 absolute top-20 right-24 filter-[url(#pixelate)]" />
          <SolIcon className="size-8 absolute top-22 right-8 filter-[url(#pixelate)]" />
          <BtcIcon className="size-9 absolute bottom-7 right-25 filter-[url(#pixelate)]" />
          <UsdtIcon className="size-8 absolute bottom-5 right-8 filter-[url(#pixelate)]" />
        </div>
      </div>

      <BaseModalDialog
        open={open}
        onClose={() => setOpen(false)}
        title={
          <span className="flex items-center gap-1.5">
            <ShieldCheckIcon className="size-5 text-fg-secondary" />
            What is a shielded account?
          </span>
        }
      >
        <div className="text-fg-secondary text-sm font-medium space-y-4">
          <p>
            Coming soon your NEAR Intents account will have offer a unique
            capability, that we call <strong>Shielded Mode</strong>.
          </p>
          <p>
            In Shielded Mode all of your activities, e.g. deposits, transfers,
            and swaps, will be private on the blockchain—
            <strong>visible only to you!</strong>
          </p>
          <p>
            And if you need to make these activities for compliance, taxation or
            any other reason, you'll have a personal cryptographic key that you
            can provide, to enable transparency to the key-holder.
          </p>
          <p>
            Shielded Mode will be powered by the industry-leading technologies
            from the <strong>NEAR Protocol</strong> and{" "}
            <strong>NEAR Intents</strong>, and will facilitate the privacy you
            need in a world of increasing surveillance and data leakage threats.
          </p>
        </div>
      </BaseModalDialog>
    </>
  )
}

export default ShieldPromo
