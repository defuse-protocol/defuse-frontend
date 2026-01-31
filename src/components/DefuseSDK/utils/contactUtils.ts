import type { ContactBlockchain } from "@src/app/(app)/(auth)/contacts/actions"
import { chainIcons, nearIntentsAccountIcon } from "../constants/blockchains"
import { chainNameToNetworkName } from "../features/withdraw/components/WithdrawForm/utils"
import type { SupportedChainName } from "../types/base"
import { reverseAssetNetworkAdapter } from "./adapters"

export type ContactChainInfo = {
  chainKey: SupportedChainName | "near_intents"
  chainIcon: { dark: string; light: string }
  chainName: string
}

function isNearIntentsContact(
  blockchain: ContactBlockchain
): blockchain is "near_intents" {
  return blockchain === "near_intents"
}

export function getContactChainInfo(
  blockchain: ContactBlockchain
): ContactChainInfo {
  if (isNearIntentsContact(blockchain)) {
    return {
      chainKey: "near_intents",
      chainIcon: nearIntentsAccountIcon,
      chainName: "Near Intents",
    }
  }
  const chainKey = reverseAssetNetworkAdapter[blockchain]
  return {
    chainKey,
    chainIcon: chainIcons[chainKey],
    chainName: chainNameToNetworkName(chainKey),
  }
}

export function contactBlockchainToChainKey(
  blockchain: ContactBlockchain
): SupportedChainName | "near_intents" {
  if (isNearIntentsContact(blockchain)) {
    return "near_intents"
  }
  return reverseAssetNetworkAdapter[blockchain]
}
