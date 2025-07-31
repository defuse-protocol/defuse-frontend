import { useEffect, useRef } from "react"
import type { ActorRefFrom } from "xstate"
import type { ModalConfirmAddPubkeyPayload } from "../../../components/Modal/ModalConfirmAddPubkey"
import { useModalStore } from "../../../providers/ModalStoreProvider"
import { ModalType } from "../../../stores/modalStore"
import { assert } from "../../../utils/assert"
import type {
  SendNearTransaction,
  publicKeyVerifierMachine,
} from "../../machines/publicKeyVerifierMachine"

export function usePublicKeyModalOpener(
  publicKeyVerifierRef:
    | ActorRefFrom<typeof publicKeyVerifierMachine>
    | undefined,
  sendNearTransaction: SendNearTransaction
) {
  const { setModalType, onCloseModal } = useModalStore((state) => state)

  const sendNearTransactionRef = useRef(sendNearTransaction)
  sendNearTransactionRef.current = sendNearTransaction

  useEffect(() => {
    if (!publicKeyVerifierRef) return

    const sub = publicKeyVerifierRef.subscribe((snapshot) => {
      if (snapshot.matches("checked")) {
        assert(snapshot.context.nearAccount, "Near account is not set")

        setModalType(ModalType.MODAL_CONFIRM_ADD_PUBKEY, {
          accountId: snapshot.context.nearAccount.accountId,
          onConfirm: () => {
            publicKeyVerifierRef.send({
              type: "ADD_PUBLIC_KEY",
              sendNearTransaction: sendNearTransactionRef.current,
            })
            onCloseModal()
          },
          onAbort: () => {
            publicKeyVerifierRef.send({ type: "ABORT_ADD_PUBLIC_KEY" })
          },
        } satisfies ModalConfirmAddPubkeyPayload)
      }
    })

    return () => {
      sub.unsubscribe()
    }
  }, [publicKeyVerifierRef, setModalType, onCloseModal])
}
