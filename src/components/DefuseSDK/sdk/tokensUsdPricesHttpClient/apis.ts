import { request } from "@defuse-protocol/internal-utils"
import { config as globalConfig } from "../../config"
import type { RequestConfig, TokensUsdPricesPayload } from "./types"

export async function tokens(
  config?: RequestConfig | undefined
): Promise<TokensUsdPricesPayload> {
  const response = await request({
    url: new URL("tokens", globalConfig.env.managerConsoleBaseURL),
    ...config,
    fetchOptions: {
      ...config?.fetchOptions,
      method: "GET",
    },
  })

  return response.json()
}
