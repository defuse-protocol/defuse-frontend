// "use client"

// import { EnvelopeIcon } from "@heroicons/react/20/solid"
// import Button from "@src/components/Button"
// import ModalAddEmail from "@src/components/DefuseSDK/components/Modal/ModalAddEmail"
// import PageHeader from "@src/components/PageHeader"
// import { PasskeyIcon } from "@src/icons"
// import { useState } from "react"
import { notFound } from "next/navigation"

export default function SettingsPage() {
  notFound()

  // const [modalType, setModalType] = useState<"addEmail" | "addPasskey" | null>(
  //   null
  // )
  // const closeModal = () => setModalType(null)

  // return (
  //   <>
  //     <PageHeader title="Settings" />

  //     <section className="mt-8">
  //       <h2 className="text-fg text-base font-semibold">Email address</h2>
  //       <p className="mt-1 text-sm text-fg-secondary">
  //         Add an email so you can sign in and recover access if you lose this
  //         device.
  //       </p>
  //       <div className="bg-surface-card rounded-3xl p-4 border border-border mt-3 flex items-center gap-3">
  //         <div className="size-10 flex items-center justify-center rounded-full bg-surface-active shrink-0">
  //           <EnvelopeIcon className="size-5 text-fg-tertiary" />
  //         </div>
  //         <div className="text-fg text-sm font-semibold flex-1">
  //           No email address
  //         </div>
  //         <Button
  //           variant="secondary"
  //           size="sm"
  //           onClick={() => setModalType("addEmail")}
  //         >
  //           Add email
  //         </Button>
  //       </div>
  //     </section>

  //     <section className="mt-10">
  //       <h2 className="text-fg text-base font-semibold">Passkey</h2>
  //       <p className="mt-1 text-sm text-fg-secondary">
  //         Create a passkey for fast, phishing-resistant sign-in on this device
  //         (and synced devices, if enabled).
  //       </p>
  //       <div className="bg-surface-card rounded-3xl p-4 border border-border mt-3 flex items-center gap-3">
  //         <div className="size-10 flex items-center justify-center rounded-full bg-surface-active shrink-0">
  //           <PasskeyIcon className="size-5 text-fg-tertiary" />
  //         </div>
  //         <div className="text-fg text-sm font-semibold flex-1">
  //           No passkey
  //         </div>
  //         <Button variant="secondary" size="sm">
  //           Add passkey
  //         </Button>
  //       </div>
  //     </section>

  //     <ModalAddEmail open={modalType === "addEmail"} onClose={closeModal} />
  //   </>
  // )
}
