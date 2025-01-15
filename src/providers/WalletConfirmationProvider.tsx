"use client"

import { useActor } from "@xstate/react"
import { useEffect, useRef } from "react"
import { fromPromise } from "xstate"

import { WalletVerificationDialog } from "@src/components/WalletVerificationDialog"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { walletConfirmationMachine } from "@src/machines/walletConfirmationMachine"
import { useVerifiedWalletsStore } from "@src/stores/useVerifiedWalletsStore"
import {
  verifyWalletSignature,
  walletConfirmationMessageFactory,
} from "@src/utils/walletMessage"

export function WalletConfirmationProvider() {
  const { state, signOut } = useConnectWallet()
  const { addWalletAddress } = useVerifiedWalletsStore()

  if (state.address != null && !state.isVerified) {
    return (
      <WalletConfirmationUI
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

function WalletConfirmationUI({
  onConfirm,
  onAbort,
}: { onConfirm: () => void; onAbort: () => void }) {
  const { state: unconfirmedWallet } = useConnectWallet()

  const signMessage = useWalletAgnosticSignMessage()

  const [state, send, serviceRef] = useActor(
    walletConfirmationMachine.provide({
      actors: {
        confirmWallet: fromPromise(async () => {
          if (unconfirmedWallet.address == null) {
            return false
          }

          const walletSignature = await signMessage(
            walletConfirmationMessageFactory(unconfirmedWallet.address)
          )

          return verifyWalletSignature(
            walletSignature,
            unconfirmedWallet.address
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
        if (state.matches("confirmed")) {
          onConfirmRef.current()
        }
        if (state.matches("aborted")) {
          onAbortRef.current()
        }
      }).unsubscribe,
    [serviceRef]
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
      isConfirming={state.matches("confirming")}
      isFailure={state.context.hadError}
    />
  )
}
