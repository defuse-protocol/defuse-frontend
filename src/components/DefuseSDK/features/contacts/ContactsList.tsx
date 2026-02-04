"use client"
import { authIdentity } from "@defuse-protocol/internal-utils"
import { PencilSquareIcon, XCircleIcon } from "@heroicons/react/16/solid"
import { PlusIcon } from "@heroicons/react/20/solid"
import type { Contact } from "@src/app/(app)/(auth)/contacts/actions"
import Button from "@src/components/Button"
import ModalAddEditContact from "@src/components/DefuseSDK/components/Modal/ModalAddEditContact"
import ModalNoResults from "@src/components/DefuseSDK/components/Modal/ModalNoResults"
import { NetworkIcon } from "@src/components/DefuseSDK/components/Network/NetworkIcon"
import SearchBar from "@src/components/DefuseSDK/components/SearchBar"
import { chainIcons } from "@src/components/DefuseSDK/constants/blockchains"
import {
  chainNameToNetworkName,
  midTruncate,
} from "@src/components/DefuseSDK/features/withdraw/components/WithdrawForm/utils"
import { stringToColor } from "@src/components/DefuseSDK/utils/stringToColor"
import EmptyState from "@src/components/EmptyState"
import ListItem from "@src/components/ListItem"
import PageHeader from "@src/components/PageHeader"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { SendIcon, WalletIcon } from "@src/icons"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import ModalRemoveContact from "../../components/Modal/ModalRemoveContact"
import { reverseAssetNetworkAdapter } from "../../utils/adapters"
import { useWatchHoldings } from "../account/hooks/useWatchHoldings"
import { buildContactTransferUrl } from "./utils/buildContactTransferUrl"

type ModalType = "create" | "edit" | "remove"

const ContactsList = ({
  contacts,
  search,
}: {
  contacts: Contact[]
  search: string | undefined
}) => {
  const router = useRouter()
  const { state } = useConnectWallet()
  const userId =
    state.isAuthorized && state.address && state.chainType
      ? authIdentity.authHandleToIntentsUserId(state.address, state.chainType)
      : null
  const { data: holdings = [] } = useWatchHoldings({
    userId,
    tokenList: LIST_TOKENS,
  })
  const [modalOpen, setModalOpen] = useState<ModalType | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isPending, startTransition] = useTransition()
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>()
  const isSearching = Boolean(timeoutId || isPending)

  const handleOpenModal = ({
    type,
    contact,
  }: {
    type: ModalType
    contact: Contact | null
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

  const hasSearchQuery = Boolean(search)
  const hasNoContacts = contacts.length === 0
  const isAddEditModalOpen = modalOpen === "edit" || modalOpen === "create"

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle="Send crypto like sending an email"
        intro={
          <>
            <p>
              Make transfers less susceptible to mistakes and scams, by using
              Contacts.
            </p>
            <p>
              How does this work? Instead of sending to a long, complex address
              like,{" "}
              <code className="bg-gray-700 rounded-md px-1 py-0.5 text-xs break-all">
                0xAcF36260817d1c78C471406BdE482177a1935071
              </code>
              , simply send to{" "}
              <span className="text-white font-semibold">Mary Johnson</span>{" "}
              instead!
            </p>
            <p>
              For each contact you create, you'll specify a name, a network,
              like Ethereum, and an address. Easy peasy.
            </p>
          </>
        }
      />

      {(!hasNoContacts || hasSearchQuery) && (
        <div className="mt-7 flex items-center gap-1">
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
          <Button
            size="lg"
            variant="primary"
            onClick={() => handleOpenModal({ type: "create", contact: null })}
          >
            <PlusIcon className="size-4" />
            Create contact
          </Button>
        </div>
      )}

      {hasNoContacts && !hasSearchQuery && (
        <EmptyState className="mt-9">
          <EmptyState.Title>No contacts yet</EmptyState.Title>
          <EmptyState.Description>
            Create a contact to get started.
          </EmptyState.Description>
          <Button
            size="xl"
            onClick={() => handleOpenModal({ type: "create", contact: null })}
            className="mt-4"
          >
            <PlusIcon className="size-5 shrink-0" />
            Create contact
          </Button>
        </EmptyState>
      )}

      {hasNoContacts && hasSearchQuery && (
        <div className="pt-8">
          <ModalNoResults
            text="No contacts found"
            handleSearchClear={() => router.push("/contacts")}
          />
        </div>
      )}

      {!hasNoContacts && (
        <section className="mt-6 space-y-1">
          {processedContacts.map(({ contact, chainIcon, chainName }) => {
            const contactColor = stringToColor(
              `${contact.name}${contact.address}${contact.blockchain}`
            )
            return (
              <ListItem
                key={contact.id}
                popoverItems={[
                  {
                    label: "Transfer",
                    href: buildContactTransferUrl(
                      contact,
                      holdings,
                      LIST_TOKENS
                    ),
                    icon: SendIcon,
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
                  className="size-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 outline-1 -outline-offset-1 outline-gray-900/10"
                  style={{ backgroundColor: contactColor.background }}
                >
                  <WalletIcon
                    className="size-5 text-gray-500"
                    style={{ color: contactColor.icon }}
                  />
                </div>
                <ListItem.Content>
                  <ListItem.Title className="line-clamp-1">
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
      )}

      <ModalAddEditContact
        open={isAddEditModalOpen}
        contact={selectedContact ?? null}
        onClose={() => {
          setModalOpen(null)
        }}
        onCloseAnimationEnd={() => {
          setSelectedContact(null)
          router.refresh()
        }}
      />
      <ModalRemoveContact
        open={modalOpen === "remove"}
        contact={selectedContact}
        onClose={() => setModalOpen(null)}
        onCloseAnimationEnd={() => {
          setSelectedContact(null)
          router.refresh()
        }}
      />
    </>
  )
}

export default ContactsList
