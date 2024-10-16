"use client"

import { useEffect, useState } from "react"

import { useQueryCollector } from "@src/hooks/useQuery"
import { useHistoryStore } from "@src/providers/HistoryStoreProvider"
import { HistoryData } from "@src/stores/historyStore"
import { NEAR_COLLECTOR_KEY } from "@src/constants/contracts"
import { useHistoryLatest } from "@src/hooks/useHistoryLatest"
import { adapterIntent0, adapterIntent1 } from "@src/libs/de-sdk/utils/adapters"

export interface CollectorHook {
  getTransactions: () => Promise<HistoryData[]>
}

// This hook uses modules for gathering historical transactions, filtering, and
// transferring to history module
export const useHistoryCollector = (collectorHooks: CollectorHook[]) => {
  const [isFetching, setIsFetching] = useState(false)
  const [isError, setIsError] = useState(false)
  const { data, updateHistory } = useHistoryStore((state) => state)
  const { runHistoryUpdate } = useHistoryLatest()

  const runTransactionCollector = async () => {
    try {
      setIsFetching(true)
      const allTransactions = await Promise.all(
        collectorHooks.map((hook) => hook.getTransactions())
      )
      const getTransactionHistories = allTransactions.flat()
      const getHistoryFromLocal = localStorage.getItem(NEAR_COLLECTOR_KEY)
      let getHistoryFromStore: HistoryData[] = []
      data.forEach((value) => getHistoryFromStore.push(value))

      // Do merge as we suppose that this is initial fetch
      if (!getHistoryFromStore.length && getHistoryFromLocal) {
        const parsedData: { data: HistoryData[] } =
          JSON.parse(getHistoryFromLocal)

        // TODO Could be removed in some period of time
        // Due to resolve backward compatible issue, temporary we have to check outdated history key `clientId`
        parsedData.data.forEach((el) => {
          const _clientId = (el as unknown as { clientId: string })?.clientId
          if (_clientId) {
            return {
              ...el,
              intentId: _clientId,
            }
          }
          return {
            ...el,
          }
        })

        if (Array.isArray(parsedData.data)) {
          getHistoryFromStore = [
            ...getHistoryFromStore,
            ...(parsedData.data as HistoryData[]),
          ]
        }
      }
      const history = [...getHistoryFromStore, ...getTransactionHistories]
      // console.log("Data before store to the history: ", history)
      updateHistory(history)

      const validHistoryStatuses: string[] = [
        ...adapterIntent0.completedStatuses,
        ...adapterIntent1.completedStatuses,
      ]

      const isHistoryNotComplete = history.some(
        (history) =>
          !history?.errorMessage?.length &&
          !validHistoryStatuses.includes(history?.status ?? "")
      )
      if (isHistoryNotComplete) runHistoryUpdate(history)

      setIsFetching(false)
    } catch (e) {
      console.log("runTransactionCollector: ", e)
      setIsError(true)
      setIsFetching(false)
    }
  }

  useEffect(() => {
    if (data.size) {
      runTransactionCollector()
    }
  }, [data.size])

  return {
    runTransactionCollector,
    isFetching,
    isError,
  }
}

export const useCombinedHistoryCollector = () => {
  const queryCollector = useQueryCollector()
  return useHistoryCollector([queryCollector])
}
