import { getContacts } from "@src/app/(app)/(auth)/contacts/actions"
import ContactsList from "@src/components/DefuseSDK/features/contacts/ContactsList"

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

  const result = await getContacts({ search })
  const contacts = result.ok ? result.value : []

  return <ContactsList contacts={contacts} search={search} />
}
