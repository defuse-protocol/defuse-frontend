import type { ChainType } from "@defuse-protocol/defuse-sdk"
import { useEffect, useState } from "react"

const NEAR_CONNECTION_AGREEMENT_CONFIRMED =
  "near_connection_agreement_confirmed"
const SOLANA_CONNECTION_AGREEMENT_CONFIRMED =
  "solana_connection_agreement_confirmed"

type Chain = Extract<ChainType, "near" | "solana">

/**
 * Hook to manage wallet connection agreement state and show warning about Ledger
 * compatibility issues with some wallets. Some users have reported
 * problems connecting Ledger hardware wallets, even with the latest firmware and
 * wallet app versions.
 *
 * Wallets affected: Near, Solana
 */
export const useWalletAgreement = () => {
  const [context, setContext] = useState<{
    show: boolean
    chain: Chain
  } | null>(null)
  const [nearConfirmed, setNearConfirmed] = useState(false)
  const [solanaConfirmed, setSolanaConfirmed] = useState(false)

  const submit = (cb: () => void) => {
    context?.chain === "near" && setNearConfirmed(true)
    context?.chain === "solana" && setSolanaConfirmed(true)
    setContext(null)
    cb()
  }

  const off = (cb: () => void) => {
    if (!context) return cb()
    const chain = context.chain
    switch (chain) {
      case "near":
        localStorage.setItem(NEAR_CONNECTION_AGREEMENT_CONFIRMED, "true")
        setNearConfirmed(true)
        break
      case "solana":
        localStorage.setItem(SOLANA_CONNECTION_AGREEMENT_CONFIRMED, "true")
        setSolanaConfirmed(true)
        break
      default:
        chain satisfies never
    }
    setContext(null)
    cb()
  }

  useEffect(() => {
    const nearConfirmed = localStorage.getItem(
      NEAR_CONNECTION_AGREEMENT_CONFIRMED
    )
    switch (nearConfirmed) {
      case "true":
        setNearConfirmed(true)
        break
      default:
        setNearConfirmed(false)
    }

    const solanaConfirmed = localStorage.getItem(
      SOLANA_CONNECTION_AGREEMENT_CONFIRMED
    )
    switch (solanaConfirmed) {
      case "true":
        setSolanaConfirmed(true)
        break
      default:
        setSolanaConfirmed(false)
    }
  }, [])

  return {
    context,
    setContext,
    nearConfirmed,
    solanaConfirmed,
    submit,
    off,
  }
}
