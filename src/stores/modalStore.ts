"use client"

import { createStore } from "zustand/vanilla"

export enum ModalType {
  MODAL_SELECT_ASSETS = "modalSelectAssets", // @deprecated
  MODAL_REVIEW_SWAP = "modalReviewSwap",
  MODAL_CONFIRM_SWAP = "modalConfirmSwap",
  MODAL_CONNECT_NETWORKS = "modalConnectNetworks",
  MODAL_STORE_NETWORK = "modalStoreNetwork",
  MODAL_SELECT_WALLET = "modalSelectWallet",
}

export type ModalState = {
  modalType: ModalType | null
  payload?: unknown
}

export type ModalActions = {
  setModalType: (modalType: ModalType | null, payload?: unknown) => void
  onCloseModal: (payload?: unknown) => void
}

export type ModalStore = ModalState & ModalActions

export const initModalStore = (): ModalState => {
  return { modalType: null }
}
export const defaultInitState: ModalState = {
  modalType: null,
  payload: undefined,
}

export const createModalStore = (initState: ModalState = defaultInitState) => {
  return createStore<ModalStore>()((set) => ({
    ...initState,
    // It is important to clear payload in case it doesn't use in order to avoid data collision
    setModalType: (modalType: ModalType | null, payload?: unknown) =>
      set({ modalType, payload: payload || undefined }),
    onCloseModal: (payload?: unknown) => set({ modalType: null, payload }),
  }))
}
