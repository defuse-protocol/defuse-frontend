"use client"

import { PlusIcon } from "@heroicons/react/16/solid"
import Button from "@src/components/Button"
import SearchBar from "@src/components/DefuseSDK/components/SearchBar"
import PageHeader from "@src/components/PageHeader"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import ModalAddEditContact from "../../components/Modal/ModalAddEditContact"

const ContactsHeader = ({
  search,
}: {
  search: string | undefined
}) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [isPending, startTransition] = useTransition()
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>()
  const isSearching = Boolean(timeoutId || isPending)

  return (
    <>
      <PageHeader title="Contacts" />

      <div className="mt-6 flex items-center gap-1">
        <SearchBar
          key={search ?? ""}
          defaultValue={search}
          loading={isSearching}
          onChange={(event) => {
            clearTimeout(timeoutId)

            const id = setTimeout(() => {
              startTransition(() => {
                if (event.target.value) {
                  router.push(`/contacts?search=${event.target.value}`)
                } else {
                  router.push("/contacts")
                }

                setTimeoutId(undefined)
              })
            }, 500)

            setTimeoutId(id)
          }}
          onClear={() => router.push("/contacts")}
          placeholder="Search name or address"
          className="flex-1"
        />
        <Button size="lg" variant="primary" onClick={() => setOpen(true)}>
          <PlusIcon className="size-4" />
          Create contact
        </Button>
      </div>

      <ModalAddEditContact open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default ContactsHeader
