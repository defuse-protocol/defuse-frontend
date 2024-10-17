"use client"

import type { WalletSelector } from "@near-wallet-selector/core"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"
import { deserializeSignMessageParams } from "@src/utils/myNearWalletAdapter"
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

    switch (url.searchParams.get("action")) {
      case "signMessage":
        void signMessage(url, selector).catch(console.error)
        break
      case "sendTransaction":
        // todo: implement transaction sending
        throw new Error("not implemented")
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
  if (window.opener) {
    window.opener.postMessage(
      queryStringToObject(url.hash),
      window.location.origin
    )
    window.close()
  }
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