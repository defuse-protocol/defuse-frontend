import { request } from "@defuse-protocol/internal-utils"
import type {
  GeneratHLAddressParams,
  GeneratHLAddressResponse,
  RequestConfig,
} from "./types"

const HYPERUNIT_API_BASE_URL = "https://api.hyperunit.xyz"

/**
 * Generate a Hyperliquid address for a given asset and destination address
 *
 * @param params.srcChain - Source chain ("bitcoin", "solana" or "ethereum")
 * @param params.dstChain - Destination chain ("hyperliquid")
 * @param params.asset - Asset symbol ("btc", "sol" or "usdc")
 * @param params.dstAddr - Destination address
 *
 * @see https://docs.hyperunit.xyz/developers/api/generate-address
 */
export async function generateHLAddress(
  params: GeneratHLAddressParams,
  config?: RequestConfig | undefined
): Promise<GeneratHLAddressResponse> {
  const response = await request({
    url: new URL(
      `gen/${params.srcChain}/${params.dstChain}/${params.asset}/${params.dstAddr}`,
      HYPERUNIT_API_BASE_URL
    ),
    ...config,
    fetchOptions: {
      ...config?.fetchOptions,
      method: "GET",
    },
  })

  return response.json()
}
