import { reverseAssetNetworkAdapter } from "@src/components/DefuseSDK/utils/adapters"
import { logger } from "@src/utils/logger"
import { getContactByIdAction } from "../../(auth)/contacts/actions"
import { SendPageClient } from "./_components/SendPageClient"

type SearchParams = Promise<{
  token?: string
  network?: string
  recipient?: string
  contactId?: string
}>

export default async function SendPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const { token, network, recipient, contactId } = params

  let resolvedNetwork = network
  let resolvedRecipient = recipient
  let shouldUpdateUrl = false

  if (contactId) {
    const result = await getContactByIdAction({ contactId })
    if (result.ok && result.value) {
      resolvedNetwork = reverseAssetNetworkAdapter[result.value.blockchain]
      resolvedRecipient = result.value.address
    } else {
      const reason = !result.ok
        ? result.error
        : "contact not found or unsupported chain"
      logger.warn("Send page: could not resolve contactId", {
        contactId,
        reason,
      })
      // biome-ignore lint/suspicious/noConsole: intentional console report when contact fetch fails
      console.warn("[send] Could not resolve contactId", { contactId, reason })
    }
    shouldUpdateUrl = true
  }

  return (
    <SendPageClient
      presetToken={token}
      presetNetwork={resolvedNetwork}
      presetRecipient={resolvedRecipient}
      initialHadParams={!!(token || network || recipient || contactId)}
      shouldUpdateUrl={shouldUpdateUrl}
    />
  )
}
