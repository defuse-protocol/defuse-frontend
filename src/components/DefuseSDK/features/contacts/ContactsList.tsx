"use client"
import { PencilSquareIcon, XCircleIcon } from "@heroicons/react/16/solid"
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/20/solid"
import type { Contact } from "@src/app/(app)/(auth)/contacts/actions"
import Button from "@src/components/Button"
import ModalAddEditContact from "@src/components/DefuseSDK/components/Modal/ModalAddEditContact"
import { NetworkIcon } from "@src/components/DefuseSDK/components/Network/NetworkIcon"
import { chainIcons } from "@src/components/DefuseSDK/constants/blockchains"
import {
  chainNameToNetworkName,
  midTruncate,
} from "@src/components/DefuseSDK/features/withdraw/components/WithdrawForm/utils"
import { stringToColor } from "@src/components/DefuseSDK/utils/stringToColor"
import ListItem from "@src/components/ListItem"
import ListItemsSkeleton from "@src/components/ListItemsSkeleton"
import { SendIcon, WalletIcon } from "@src/icons"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import ModalRemoveContact from "../../components/Modal/ModalRemoveContact"
import { reverseAssetNetworkAdapter } from "../../utils/adapters"

type ModalType = "edit" | "remove" | "add"

const ContactsList = ({
  contacts,
  hasSearch,
}: { contacts: Contact[]; hasSearch?: boolean }) => {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState<ModalType | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  const handleOpenModal = ({
    type,
    contact,
  }: {
    type: ModalType
    contact?: Contact | null
  }) => {
    setModalOpen(type)
    setSelectedContact(contact ?? null)
  }

  const processedContacts = useMemo(
    () =>
      contacts.map((contact) => {
        const chainKey = reverseAssetNetworkAdapter[contact.blockchain]
        const chainIcon = chainIcons[chainKey]
        const chainName = chainNameToNetworkName(chainKey)
        return { contact, chainKey, chainIcon, chainName }
      }),
    [contacts]
  )

  if (contacts.length === 0) {
    // Show different empty state depending on whether user is searching
    if (hasSearch) {
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

    // Empty state with skeleton background (like Deals page)
    return (
      <>
        <section className="mt-9">
          <ListItemsSkeleton count={3} className="mt-2" />
          <div className="max-w-72 mx-auto -mt-5 relative flex flex-col items-center">
            <h3 className="text-xl font-semibold text-gray-900 text-center tracking-tight">
              No contacts yet
            </h3>
            <p className="text-base text-gray-500 mt-1 font-medium text-center text-balance">
              Create a contact to get started.
            </p>
            <Button
              size="xl"
              className="mt-4"
              onClick={() => handleOpenModal({ type: "add" })}
            >
              <PlusIcon className="size-5 shrink-0" />
              Create a contact
            </Button>
          </div>
        </section>

        <ModalAddEditContact
          open={modalOpen === "add"}
          onClose={() => setModalOpen(null)}
        />
      </>
    )
  }

  return (
    <>
      <section className="mt-6 space-y-1">
        {processedContacts.map(({ contact, chainIcon, chainName }) => {
          const contactColor = stringToColor(
            `${contact.name}${contact.address}${contact.blockchain}`
          )

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
              <div
                className="size-10 rounded-full flex items-center justify-center shrink-0 outline-1 -outline-offset-1 outline-gray-900/10"
                style={{ backgroundColor: contactColor.background }}
              >
                <WalletIcon
                  className="size-5"
                  style={{ color: contactColor.icon }}
                />
              </div>
              <ListItem.Content>
                <ListItem.Title className="truncate">
                  {contact.name}
                </ListItem.Title>
                <ListItem.Subtitle>
                  {midTruncate(contact.address)}
                </ListItem.Subtitle>
              </ListItem.Content>
              <ListItem.Content align="end">
                <ListItem.Title className="flex items-center gap-1">
                  <NetworkIcon chainIcon={chainIcon} sizeClassName="size-4" />
                  <span className="capitalize">{chainName}</span>
                </ListItem.Title>
                <div className="h-4" />
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
