import axios, { type AxiosRequestConfig } from "axios"

import { REGISTRAR_ID_REF_FINANCE } from "@src/libs/de-sdk/providers/refFinanceProvider"
import {
  APP_ORIGINAL_URL,
  COINGECKO_API_KEY_LOWER,
} from "@src/utils/environment"

import type {
  DataEstimateRequest,
  SwapEstimateProviderResponse,
} from "../types/interfaces"

export const REGISTRAR_ID_COINGECKO = "coingecko"

const getExchangesList = () => {
  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": APP_ORIGINAL_URL,
      "x-cg-pro-api-key": COINGECKO_API_KEY_LOWER,
    },
  }
  const id = "coinbase"
  return axios
    .get("https://pro-api.coingecko.com/api/v3/exchanges/list", config)
    .then((resp) => resp.data)
}

export const getTrendingList = (id = "binance") => {
  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": APP_ORIGINAL_URL,
      "x-cg-pro-api-key": COINGECKO_API_KEY_LOWER,
    },
  }
  return axios
    .get(`https://pro-api.coingecko.com/api/v3/exchanges/${id}/tickers`, config)
    .then((resp) => resp.data)
}

export const getCoinsListWithMarketData = (currency = "usd") => {
  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": APP_ORIGINAL_URL,
      "x-cg-pro-api-key": COINGECKO_API_KEY_LOWER,
    },
  }
  return axios
    .get(
      `https://pro-api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}`,
      config
    )
    .then((resp) => resp.data)
}

export const swapEstimateCoingeckoProvider = async (
  data: DataEstimateRequest
): Promise<SwapEstimateProviderResponse> => {
  try {
    const getExchangesListResponse = await getExchangesList()
    const getTrendingListResponse = await getTrendingList()
    console.log(getExchangesListResponse, "getExchangesListResponse")
    console.log(getTrendingListResponse, "getTrendingListResponse")

    return {
      registrarId: REGISTRAR_ID_COINGECKO,
    } as unknown as SwapEstimateProviderResponse
  } catch (e) {
    console.log("swapEstimateRefFinanceProvider: ", e)
    return {
      solver_id: `${REGISTRAR_ID_REF_FINANCE}:0`,
      amount_out: "0",
    } as unknown as SwapEstimateProviderResponse
  }
}
