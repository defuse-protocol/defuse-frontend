"use client"

import { useState } from "react"
import Button from "./Button"
import { BaseModalDialog } from "./DefuseSDK/components/Modal/ModalDialog"

const BankingPromo = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="relative bg-gray-800 rounded-3xl grid grid-cols-3 gap-4 group overflow-hidden">
        <div className="col-span-2 relative p-5 z-20">
          <div className="bg-brand/20 text-brand text-xs rounded-lg px-2 py-1 inline-block uppercase font-bold">
            Coming soon
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight mt-6">
            Deposit via bank transfer
          </h3>
          <p className="text-gray-400 text-sm text-balance font-medium">
            Send USD or EUR from your bank and receive stablecoins
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
        </div>
      </div>

      <BaseModalDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Deposit via bank transfer"
      >
        <div className="text-gray-500 text-sm font-medium space-y-4">
          <p>
            Coming soon, you will be able to deposit stablecoins to your NEAR
            Intents account directly by making a fiat transfer to your own
            personal US Dollar and Euro virtual bank accounts.
          </p>
        </div>
      </BaseModalDialog>
    </>
  )
}

export default BankingPromo
