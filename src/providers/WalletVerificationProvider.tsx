"use client"

import { useQuery } from "@tanstack/react-query"
import { useActor } from "@xstate/react"
import { useEffect, useRef } from "react"
import { fromPromise } from "xstate"

import { WalletBannedDialog } from "@src/components/WalletBannedDialog"
import { WalletVerificationDialog } from "@src/components/WalletVerificationDialog"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { walletVerificationMachine } from "@src/machines/walletVerificationMachine"
import { useVerifiedWalletsStore } from "@src/stores/useVerifiedWalletsStore"
import {
  verifyWalletSignature,
  walletVerificationMessageFactory,
} from "@src/utils/walletMessage"
import { useMixpanel } from "./MixpanelProvider"

export function WalletVerificationProvider() {
  const { state, signOut } = useConnectWallet()

  const safetyCheck = useQuery({
    queryKey: ["address_safety", state.address],
    queryFn: async () => {
      const response = await fetch(`/api/addresses/${state.address}/safety`)
      return response.json() as Promise<{ safetyStatus: "safe" | "unsafe" }>
    },
    enabled: state.address != null,
  })

  const { addWalletAddress } = useVerifiedWalletsStore()

  if (state.address != null && safetyCheck.data?.safetyStatus === "unsafe") {
    return (
      <WalletBannedUI
        onAbort={() => {
          if (state.chainType != null) {
            void signOut({ id: state.chainType })
          }
        }}
      />
    )
  }

  if (
    state.address != null &&
    safetyCheck.data?.safetyStatus === "safe" &&
    !state.isVerified
  ) {
    return (
      <WalletVerificationUI
        onConfirm={() => {
          if (state.address != null) {
            addWalletAddress(state.address)
          }
        }}
        onAbort={() => {
          if (state.chainType != null) {
            void signOut({ id: state.chainType })
          }
        }}
      />
    )
  }

  return null
}

function WalletBannedUI({ onAbort }: { onAbort: () => void }) {
  return <WalletBannedDialog open={true} onCancel={onAbort} />
}

function WalletVerificationUI({
  onConfirm,
  onAbort,
}: { onConfirm: () => void; onAbort: () => void }) {
  const { state: unconfirmedWallet } = useConnectWallet()

  const signMessage = useWalletAgnosticSignMessage()
  const mixPanel = useMixpanel()

  const [state, send, serviceRef] = useActor(
    walletVerificationMachine.provide({
      actors: {
        verifyWallet: fromPromise(async () => {
          if (
            unconfirmedWallet.address == null ||
            unconfirmedWallet.chainType == null
          ) {
            return false
          }

          const walletSignature = await signMessage(
            walletVerificationMessageFactory(
              unconfirmedWallet.address,
              unconfirmedWallet.chainType
            )
          )

          return verifyWalletSignature(
            walletSignature,
            unconfirmedWallet.address,
            unconfirmedWallet.chainType
          )
        }),
      },
    })
  )

  const onConfirmRef = useRef(onConfirm)
  onConfirmRef.current = onConfirm
  const onAbortRef = useRef(onAbort)
  onAbortRef.current = onAbort

  useEffect(
    () =>
      serviceRef.subscribe((state) => {
        if (state.matches("verified")) {
          onConfirmRef.current()
          mixPanel?.track("wallet_verified", {
            wallet: unconfirmedWallet.address,
            wallet_type: unconfirmedWallet.chainType,
            timestamp: new Date().toISOString(),
          })
        }
        if (state.matches("aborted")) {
          onAbortRef.current()
        }
      }).unsubscribe,
    [
      serviceRef,
      mixPanel,
      unconfirmedWallet.address,
      unconfirmedWallet.chainType,
    ]
  )

  return (
    <WalletVerificationDialog
      open={true}
      onConfirm={() => {
        send({ type: "START" })
      }}
      onCancel={() => {
        send({ type: "ABORT" })
      }}
      isVerifying={state.matches("verifying")}
      isFailure={state.context.hadError}
    />
  )
}
