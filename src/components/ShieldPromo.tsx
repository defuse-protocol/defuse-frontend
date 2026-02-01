"use client"

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
      <div className="relative mt-9 bg-gray-800 rounded-3xl grid grid-cols-3 gap-4 group overflow-hidden">
        <div className="col-span-2 p-5 relative z-20">
          <div className="bg-brand/20 text-brand text-xs rounded-lg px-2 py-1 inline-block uppercase font-bold">
            Coming soon
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight mt-6">
            Shielded account
          </h3>
          <p className="text-gray-400 text-sm text-balance font-medium">
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
          <EthIcon className="size-9 absolute top-5 left-0 filter-[url(#pixelate)]" />
          <ZecIcon className="size-7 absolute top-8 right-8 filter-[url(#pixelate)]" />
          <UsdcIcon className="size-8 absolute top-20 left-4 filter-[url(#pixelate)]" />
          <SolIcon className="size-8 absolute top-22 right-8 filter-[url(#pixelate)]" />
          <BtcIcon className="size-9 absolute bottom-7 left-2 filter-[url(#pixelate)]" />
          <UsdtIcon className="size-8 absolute bottom-5 right-8 filter-[url(#pixelate)]" />
        </div>
      </div>

      <BaseModalDialog
        open={open}
        onClose={() => setOpen(false)}
        title="What is a shielded account?"
      >
        <p className="text-gray-500 text-sm font-medium">
          TODO: Add shielded account content
        </p>
      </BaseModalDialog>
    </>
  )
}

export default ShieldPromo
