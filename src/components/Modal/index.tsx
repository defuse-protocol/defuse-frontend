"use client"

import ModalConfirmSwap from "@src/components/Modal/ModalConfirmSwap"
import ModalConnectNetworks from "@src/components/Modal/ModalConnectNetworks"
import ModalReviewSwap from "@src/components/Modal/ModalReviewSwap"
import ModalStoreNetwork from "@src/components/Modal/ModalStoreNetwork"
import { useModalStore } from "@src/providers/ModalStoreProvider"

import { ModalType } from "../../stores/modalStore"

const Modal = () => {
  const { modalType } = useModalStore((state) => state)

  switch (modalType) {
    case ModalType.MODAL_REVIEW_SWAP:
      return <ModalReviewSwap />
    case ModalType.MODAL_CONFIRM_SWAP:
      return <ModalConfirmSwap />
    case ModalType.MODAL_CONNECT_NETWORKS:
      return <ModalConnectNetworks />
    case ModalType.MODAL_STORE_NETWORK:
      return <ModalStoreNetwork />
  }
}

export default Modal
