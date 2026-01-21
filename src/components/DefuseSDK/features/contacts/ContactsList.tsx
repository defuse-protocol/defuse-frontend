"use client"
import { PencilSquareIcon, XCircleIcon } from "@heroicons/react/16/solid"
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid"
import type { Contact } from "@src/app/(app)/(auth)/contacts/actions"
import Button from "@src/components/Button"
import ModalAddEditContact from "@src/components/DefuseSDK/components/Modal/ModalAddEditContact"
import { NetworkIcon } from "@src/components/DefuseSDK/components/Network/NetworkIcon"
import { chainIcons } from "@src/components/DefuseSDK/constants/blockchains"
import {
  chainNameToNetworkName,
  midTruncate,
} from "@src/components/DefuseSDK/features/withdraw/components/WithdrawForm/utils"
import ListItem from "@src/components/ListItem"
import { SendIcon, WalletIcon } from "@src/icons"
import { useRouter } from "next/navigation"
import { useState } from "react"
import ModalRemoveContact from "../../components/Modal/ModalRemoveContact"
import { reverseAssetNetworkAdapter } from "../../utils/adapters"

type ModalType = "edit" | "remove"

const ContactsList = ({ contacts }: { contacts: Contact[] }) => {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState<ModalType | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  const handleOpenModal = ({
    type,
    contact,
  }: {
    type: ModalType
    contact: Contact
  }) => {
    setModalOpen(type)
    setSelectedContact(contact)
  }

  if (contacts.length === 0) {
    return (
      <section className="mt-6 flex flex-col items-center justify-center pt-6">
        <div
          className="size-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
          aria-hidden
        >
          <MagnifyingGlassIcon className="size-5" />
        </div>
        <h3 className="font-semibold text-base text-gray-900 mt-4">
          No contacts found
        </h3>
        <Button
          size="md"
          onClick={() => router.push("/contacts")}
          className="mt-4"
        >
          Clear search
        </Button>
      </section>
    )
  }

  return (
    <>
      <section className="mt-6 space-y-1">
        {contacts.map((contact) => {
          const chainKey = reverseAssetNetworkAdapter[contact.blockchain]
          const chainIcon = chainIcons[chainKey]
          const chainName = chainNameToNetworkName(chainKey)

          return (
            <ListItem
              key={contact.id}
              popoverContent={
                <>
                  <Button size="sm" href="/send">
                    {/* TODO: Add send to contact functionality */}
                    <SendIcon className="size-4 shrink-0" />
                    Send
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleOpenModal({ type: "edit", contact })}
                  >
                    <PencilSquareIcon className="size-4 shrink-0" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleOpenModal({ type: "remove", contact })}
                  >
                    <XCircleIcon className="size-4 shrink-0" />
                    Remove
                  </Button>
                </>
              }
            >
              <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center outline-1 -outline-offset-1 outline-gray-900/10">
                <WalletIcon className="size-5 text-gray-500" />
              </div>
              <ListItem.Content>
                <ListItem.Title>{contact.name}</ListItem.Title>
                <ListItem.Subtitle>
                  {midTruncate(contact.address)}
                </ListItem.Subtitle>
              </ListItem.Content>
              <ListItem.Content align="end">
                <ListItem.Title className="flex items-center gap-1">
                  <NetworkIcon chainIcon={chainIcon} sizeClassName="size-4" />
                  <span className="capitalize">{chainName}</span>
                </ListItem.Title>
              </ListItem.Content>
            </ListItem>
          )
        })}
      </section>

      <ModalAddEditContact
        open={modalOpen === "edit"}
        contact={selectedContact}
        onClose={() => setModalOpen(null)}
        onCloseAnimationEnd={() => setSelectedContact(null)}
      />
      <ModalRemoveContact
        open={modalOpen === "remove"}
        contact={selectedContact}
        onClose={() => setModalOpen(null)}
        onCloseAnimationEnd={() => setSelectedContact(null)}
      />
    </>
  )
}

export default ContactsList
