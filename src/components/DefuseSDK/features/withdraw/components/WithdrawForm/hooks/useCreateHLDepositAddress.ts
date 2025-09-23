import { useQuery } from "@tanstack/react-query"
import { logger } from "../../../../../logger"
import { generateHLAddress } from "../../../../../sdk/hyperunit/apis"
import type { SupportedChainName, TokenInfo } from "../../../../../types/base"
import {
  getHyperliquidAsset,
  getHyperliquidSrcChain,
  isHyperliquid,
} from "../../../utils/hyperliquid"

export type HLDepositAddressResult =
  | {
      tag: "ok"
      value: string | null
    }
  | { tag: "err"; value: { reason: "ERR_HYPERLIQUID_ADDRESS_GENERATION" } }

export const useCreateHLDepositAddress = (
  token: TokenInfo,
  blockchain: SupportedChainName | "near_intents",
  dstAddr: string
) => {
  return useQuery<HLDepositAddressResult>({
    queryKey: ["hyperliquid_deposit_address", { token, blockchain, dstAddr }],
    queryFn: async () => {
      try {
        if (!isHyperliquid(blockchain)) {
          return {
            tag: "ok",
            value: null,
          }
        }
        const srcChain = getHyperliquidSrcChain(token)

        const response = await generateHLAddress({
          srcChain,
          dstChain: "hyperliquid",
          asset: getHyperliquidAsset(token),
          dstAddr,
        })
        return {
          tag: "ok",
          value: response.address,
        }
      } catch (error) {
        logger.error(
          new Error("Failed to generate Hyperliquid deposit address", {
            cause: error,
          })
        )
        return {
          tag: "err",
          value: { reason: "ERR_HYPERLIQUID_ADDRESS_GENERATION" },
        }
      }
    },
    enabled: blockchain && dstAddr !== "",
  })
}
