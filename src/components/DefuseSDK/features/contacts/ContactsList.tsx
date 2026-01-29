"use client"
import {
  PencilSquareIcon,
  Square2StackIcon,
  XCircleIcon,
} from "@heroicons/react/16/solid"
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid"
import type { Contact } from "@src/app/(app)/(auth)/contacts/actions"
import Button from "@src/components/Button"
import ModalAddEditContact from "@src/components/DefuseSDK/components/Modal/ModalAddEditContact"
import { NetworkIcon } from "@src/components/DefuseSDK/components/Network/NetworkIcon"
import {
  chainIcons,
  nearIntentsAccountIcon,
} from "@src/components/DefuseSDK/constants/blockchains"
import {
  chainNameToNetworkName,
  midTruncate,
} from "@src/components/DefuseSDK/features/withdraw/components/WithdrawForm/utils"
import { stringToColor } from "@src/components/DefuseSDK/utils/stringToColor"
import ListItem from "@src/components/ListItem"
import { SendIcon, WalletIcon } from "@src/icons"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
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

  const processedContacts = useMemo(() => {
    const processed = contacts.map((contact) => {
      // Handle near_intents as a special case
      if (contact.blockchain === "near_intents") {
        return {
          contact,
          chainKey: "near_intents" as const,
          chainIcon: nearIntentsAccountIcon,
          chainName: "Near Intents",
        }
      }

      const chainKey = reverseAssetNetworkAdapter[contact.blockchain]
      const chainIcon = chainIcons[chainKey]
      const chainName = chainNameToNetworkName(chainKey)
      return { contact, chainKey, chainIcon, chainName }
    })

    // Sort alphabetically by contact name
    return processed.sort((a, b) =>
      a.contact.name.localeCompare(b.contact.name)
    )
  }, [contacts])

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
        {processedContacts.map(
          ({ contact, chainKey, chainIcon, chainName }) => {
            const contactColor = stringToColor(
              `${contact.name}${contact.address}${contact.blockchain}`
            )

            return (
              <ListItem
                key={contact.id}
                dropdownMenuItems={[
                  {
                    label: "Transfer",
                    href: `/send?contactId=${contact.id}&recipient=${encodeURIComponent(contact.address)}&network=${chainKey}`,
                    icon: SendIcon,
                  },
                  {
                    label: "Copy",
                    onClick: () => {
                      navigator.clipboard.writeText(contact.address)
                    },
                    icon: Square2StackIcon,
                  },
                  {
                    label: "Edit",
                    onClick: () => handleOpenModal({ type: "edit", contact }),
                    icon: PencilSquareIcon,
                  },
                  {
                    label: "Remove",
                    onClick: () => handleOpenModal({ type: "remove", contact }),
                    icon: XCircleIcon,
                  },
                ]}
              >
                <div
                  className="size-10 rounded-full bg-gray-200 flex items-center justify-center outline-1 -outline-offset-1 outline-gray-900/10"
                  style={{ backgroundColor: contactColor.background }}
                >
                  <WalletIcon className="size-5 text-gray-500" />
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
                    <span className="capitalize">{chainName}</span>
                    <NetworkIcon chainIcon={chainIcon} sizeClassName="size-4" />
                  </ListItem.Title>
                </ListItem.Content>
              </ListItem>
            )
          }
        )}
        {processedContacts.map(({ contact, chainIcon, chainName }) => {
          const contactColor = stringToColor(
            `${contact.name}${contact.address}${contact.blockchain}`
          )

          return (
            <ListItem
              key={contact.id}
              dropdownMenuItems={[
                { label: "Send", href: "/send", icon: SendIcon },
                {
                  label: "Edit",
                  onClick: () => handleOpenModal({ type: "edit", contact }),
                  icon: PencilSquareIcon,
                },
                {
                  label: "Remove",
                  onClick: () => handleOpenModal({ type: "remove", contact }),
                  icon: XCircleIcon,
                },
              ]}
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
                  <span className="capitalize">{chainName}</span>
                  <NetworkIcon chainIcon={chainIcon} sizeClassName="size-4" />
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
