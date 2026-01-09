import type { BlockchainEnum } from "@defuse-protocol/internal-utils"
import ContactsHeader from "@src/components/DefuseSDK/features/contacts/ContactsHeader"
import ContactsList from "@src/components/DefuseSDK/features/contacts/ContactsList"
import ListItemSkeleton from "@src/components/ListItemsSkeleton"
import { Suspense } from "react"

export type Contact = {
  id: number
  address: string
  name: string
  network: BlockchainEnum | null
}

const contacts: Contact[] = [
  {
    id: 1,
    address: "0xAbC1234567890DeFabc1234567890abcdEf12345",
    name: "Michael's Wallet",
    network: "eth:1",
  },
  {
    id: 2,
    address: "0x1234567890abcdef1234567890abcdef12345678",
    name: "Nexo Savings",
    network: "eth:43114",
  },
  {
    id: 3,
    address: "0xFAcE851C0EfEdEadcafe1234567890dEfAce1234",
    name: "Base Staking",
    network: "eth:8453",
  },
  {
    id: 4,
    address: "0xBeEfFAcedBabeFACE1234567890BeEfFacE00000",
    name: "Binance Main Account",
    network: "eth:56",
  },
]

const fetchContactsFromDB = async (search?: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  if (!search) return contacts

  const searchLower = search.toLowerCase()

  return contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchLower) ||
      contact.address.toLowerCase().includes(searchLower)
  )
}

const ContactsListSuspense = async ({ search }: { search?: string }) => {
  const contacts = await fetchContactsFromDB(search)

  return <ContactsList contacts={contacts} />
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParamsData = await searchParams

  const search =
    typeof searchParamsData.search === "string"
      ? searchParamsData.search
      : undefined

  return (
    <>
      <ContactsHeader search={search} />

      <Suspense
        fallback={<ListItemSkeleton count={4} className="mt-6" loading />}
      >
        <ContactsListSuspense search={search} />
      </Suspense>
    </>
  )
}
