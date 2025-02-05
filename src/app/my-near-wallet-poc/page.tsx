"use client"

import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import { logger } from "@src/utils/logger"
import { useState } from "react"

export default function Page() {
  const [state, setState] = useState<object>({ status: "idle" })
  const { signMessage } = useNearWalletActions()

  const openWindow = () => {
    setState({ status: "singing" })

    signMessage({
      message: "Hey",
      recipient: "wrap.near",
      nonce: Buffer.from(crypto.getRandomValues(new Uint8Array(32))),
    }).then(
      (result) => {
        console.log("signed", result)
        setState({ status: "success", data: result })
      },
      (err) => {
        logger.error(err)
        setState({ type: "error", error: err.message })
      }
    )
  }

  return (
    <div>
      <button type={"button"} onClick={openWindow}>
        open
      </button>

      <div>
        Status:
        <pre>{JSON.stringify(state, null, "  ")}</pre>
      </div>
    </div>
  )
}
