import type { Contact } from "@src/app/(app)/(auth)/contacts/actions"
import type { SupportedChainName, TokenInfo } from "../../../types/base"
import { reverseAssetNetworkAdapter } from "../../../utils/adapters"
import { getDerivedToken } from "../../../utils/tokenUtils"
import type { Holding } from "../../account/types/sharedTypes"

function findBestTokenFromHoldings(
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

function findAnyTokenForNetwork(
  tokenList: TokenInfo[],
  network: SupportedChainName
): string | undefined {
  for (const token of tokenList) {
    if (getDerivedToken(token, network)) {
      return token.symbol
    }
  }
  return undefined
}

export function buildContactTransferUrl(
  contact: Contact,
  holdings: Holding[],
  tokenList: TokenInfo[]
): string {
  const network = reverseAssetNetworkAdapter[contact.blockchain]
  const token =
    findBestTokenFromHoldings(holdings, network) ??
    findAnyTokenForNetwork(tokenList, network)

  const params = new URLSearchParams({
    contactId: contact.contactId,
    recipient: contact.address,
    network,
  })

  if (token) {
    params.set("token", token)
  }

  return `/send?${params.toString()}`
}
