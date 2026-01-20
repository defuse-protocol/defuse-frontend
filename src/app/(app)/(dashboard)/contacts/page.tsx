import { getContacts } from "@src/app/(app)/(auth)/contacts/actions"
import ContactsHeader from "@src/components/DefuseSDK/features/contacts/ContactsHeader"
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

  return (
    <>
      {/* TODO: Remove this before production */}
      <div className="flex justify-end">
        <a className="text-blue-500" href="/dev/generate-token">
          {"> Generate test auth token"}
        </a>
      </div>

      <ContactsHeader search={search} />
      <ContactsList contacts={contacts} />
    </>
  )
}
