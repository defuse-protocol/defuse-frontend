import axios, { AxiosResponse } from "axios"

import type { SolverTokenList } from "@src/libs/de-sdk/providers/solver0Provider"
import type {
  BitcoinBalanceEntity,
  BitcoinPriceInUsdEntity,
  Result,
} from "@src/types/interfaces"
import {
  BITCOIN_INFO_URL,
  COINGECKO_API_URL,
  SOLVER_RELAY_0_URL,
} from "@src/utils/environment"

export const getDiscoverDefuseAssets = (
  address: string
): Promise<Result<SolverTokenList>> =>
  axios
    .post(SOLVER_RELAY_0_URL, {
      jsonrpc: "2.0",
      id: "dontcare",
      method: "discover_defuse_assets",
      params: [address],
    })
    .then((resp) => resp.data)

export const getBitcoinBalance = (
  address: string
): Promise<BitcoinBalanceEntity> =>
  axios.get(`${BITCOIN_INFO_URL}/${address}`).then((resp) => resp.data)

export const getBitcoinPriceInUsd = (): Promise<BitcoinPriceInUsdEntity> =>
  axios
    .get(`${COINGECKO_API_URL}/simple/price?ids=bitcoin&vs_currencies=usd`)
    .then((resp) => resp.data)
