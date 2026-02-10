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
  //       <h2 className="text-gray-900 text-base font-semibold">Email address</h2>
  //       <p className="mt-1 text-sm text-gray-500">
  //         Add an email so you can sign in and recover access if you lose this
  //         device.
  //       </p>
  //       <div className="bg-white rounded-3xl p-4 border border-gray-200 mt-3 flex items-center gap-3">
  //         <div className="size-10 flex items-center justify-center rounded-full bg-gray-100 shrink-0">
  //           <EnvelopeIcon className="size-5 text-gray-400" />
  //         </div>
  //         <div className="text-gray-900 text-sm font-semibold flex-1">
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
  //       <h2 className="text-gray-900 text-base font-semibold">Passkey</h2>
  //       <p className="mt-1 text-sm text-gray-500">
  //         Create a passkey for fast, phishing-resistant sign-in on this device
  //         (and synced devices, if enabled).
  //       </p>
  //       <div className="bg-white rounded-3xl p-4 border border-gray-200 mt-3 flex items-center gap-3">
  //         <div className="size-10 flex items-center justify-center rounded-full bg-gray-100 shrink-0">
  //           <PasskeyIcon className="size-5 text-gray-400" />
  //         </div>
  //         <div className="text-gray-900 text-sm font-semibold flex-1">
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
