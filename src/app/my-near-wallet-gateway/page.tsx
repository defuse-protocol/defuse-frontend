"use client"

import type { WalletSelector } from "@near-wallet-selector/core"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import {
  deserializeSignAndSendTransactionsParams,
  deserializeSignMessageParams,
} from "@src/utils/myNearWalletAdapter"
import { useEffect } from "react"

export default function MyNearWalletGateway() {
  const { selector } = useWalletSelector()

  useEffect(() => {
    const url = new URL(window.location.href)

    // If hash exists, then it's a callback from the wallet
    if (url.hash !== "") {
      relayResultToOpener(url)
      return
    }

    if (url.searchParams.get("errorCode")) {
      relayResultToOpenerError(url)
      return
    }

    if (url.searchParams.get("transactionHashes")) {
      relayResultToOpenerTransactionHashes(url)
      return
    }

    switch (url.searchParams.get("action")) {
      case "signMessage":
        void signMessage(url, selector).catch(console.error)
        break
      case "sendTransaction":
        // todo: implement transaction sending
        throw new Error("not implemented")
      case "signAndSendTransactions":
        void signAndSendTransactions(url, selector).catch(console.error)
        break
      default:
        console.warn("Unknown action", {
          action: url.searchParams.get("action"),
        })
    }
  }, [selector])

  return null
}

/**
 * Receives the callback from the wallet and sends the message to the app
 */
function relayResultToOpener(url: URL) {
  const channelId = url.searchParams.get("channelId")
  if (!channelId) throw new Error("Missing channelId")

  const channel = new BroadcastChannel(channelId)
  channel.postMessage(queryStringToObject(url.hash))
  channel.close()
  window.close()
}

function relayResultToOpenerError(url: URL) {
  const channelId = url.searchParams.get("channelId")
  if (!channelId) throw new Error("Missing channelId")

  const channel = new BroadcastChannel(channelId)
  channel.postMessage({
    errorCode: url.searchParams.get("errorCode"),
    errorMessage: url.searchParams.get("errorMessage"),
  })
  channel.close()
  window.close()
}

function relayResultToOpenerTransactionHashes(url: URL) {
  const channelId = url.searchParams.get("channelId")
  if (!channelId) throw new Error("Missing channelId")

  const channel = new BroadcastChannel(channelId)
  channel.postMessage({
    transactionHashes: url.searchParams.get("transactionHashes"),
  })
  channel.close()
  window.close()
}

async function signAndSendTransactions(
  url: URL,
  walletSelector: WalletSelector
) {
  const paramsComponent = url.searchParams.get("params")
  if (paramsComponent == null) {
    throw new Error("Missing params")
  }
  const params = deserializeSignAndSendTransactionsParams(
    decodeURIComponent(paramsComponent)
  )

  const wallet = await walletSelector.wallet()
  await wallet.signAndSendTransactions(params)
}

async function signMessage(url: URL, walletSelector: WalletSelector) {
  const paramsComponent = url.searchParams.get("params")
  if (paramsComponent == null) {
    throw new Error("Missing params")
  }

  const params = deserializeSignMessageParams(
    decodeURIComponent(paramsComponent)
  )

  const wallet = await walletSelector.wallet()
  await wallet.signMessage(params)
}

function queryStringToObject(queryString: string) {
  // Remove the leading # and the trailing & if present
  const normQueryString = queryString.replace(/^#|&$/g, "")

  // Split by & and then by = to form key-value pairs
  return normQueryString.split("&").reduce(
    (acc, pair) => {
      const [key, value] = pair.split("=")
      acc[key] = decodeURIComponent(value) // Decode URI components
      return acc
    },
    {} as Record<string, string>
  )
}
