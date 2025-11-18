import { useModalStore } from "../../providers/ModalStoreProvider"

import { ModalType } from "../../stores/modalStore"

import { ModalConfirmAddPubkey } from "./ModalConfirmAddPubkey"
import { ModalSelectAssets } from "./ModalSelectAssets"
import { ModalSlippageSettings } from "./ModalSlippageSettings"

export const ModalContainer = () => {
  const { modalType } = useModalStore((state) => state)

  switch (modalType) {
    case ModalType.MODAL_SELECT_ASSETS:
      return <ModalSelectAssets />
    case ModalType.MODAL_CONFIRM_ADD_PUBKEY:
      return <ModalConfirmAddPubkey />
    case ModalType.MODAL_SLIPPAGE_SETTINGS:
      return <ModalSlippageSettings />
    default:
      return null
  }
}
