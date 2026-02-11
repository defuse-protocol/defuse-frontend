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
    shouldUpdateUrl = true
    const result = await getContactByIdAction({ contactId })

    if (!result.ok || !result.value) {
      logger.warn("Send page: could not resolve contactId", {
        contactId,
        reason: !result.ok
          ? result.error
          : "contact not found or unsupported chain",
      })
    } else {
      resolvedNetwork =
        result.value.blockchain === "near_intents"
          ? "near_intents"
          : reverseAssetNetworkAdapter[result.value.blockchain]
      resolvedRecipient = result.value.address
    }
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
