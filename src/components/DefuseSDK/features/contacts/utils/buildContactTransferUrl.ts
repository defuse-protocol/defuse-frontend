import type { Contact } from "@src/app/(app)/(auth)/contacts/actions"
import type { SupportedChainName } from "@src/components/DefuseSDK/types/base"
import { reverseAssetNetworkAdapter } from "../../../utils/adapters"
import { getDerivedToken } from "../../../utils/tokenUtils"
import type { Holding } from "../../account/types/sharedTypes"

/**
 * Finds the best token symbol for a network from user holdings.
 * Holdings are pre-sorted by USD value, so first match = highest value.
 */
function findBestTokenForNetwork(
  holdings: Holding[],
  network: SupportedChainName
): string | undefined {
  for (const holding of holdings) {
    if (getDerivedToken(holding.token, network)) {
      return holding.token.symbol
    }
  }
  return undefined
}

/**
 * Builds the send page URL with pre-filled params from a contact.
 */
export function buildContactTransferUrl(
  contact: Contact,
  holdings: Holding[]
): string {
  const network = reverseAssetNetworkAdapter[contact.blockchain]
  const token = findBestTokenForNetwork(holdings, network) ?? "USDC"

  const params = new URLSearchParams({
    contactId: contact.contactId,
    recipient: contact.address,
    network,
    token,
  })

  return `/send?${params.toString()}`
}
