import { useModalStore } from "../../providers/ModalStoreProvider"

import { ModalType } from "../../stores/modalStore"

import { ModalConfirmAddPubkey } from "./ModalConfirmAddPubkey"
import { ModalSelectAssets } from "./ModalSelectAssets"

export const ModalContainer = () => {
  const { modalType } = useModalStore((state) => state)

  switch (modalType) {
    case ModalType.MODAL_SELECT_ASSETS:
      return <ModalSelectAssets />
    case ModalType.MODAL_CONFIRM_ADD_PUBKEY:
      return <ModalConfirmAddPubkey />
    default:
      return null
  }
}
