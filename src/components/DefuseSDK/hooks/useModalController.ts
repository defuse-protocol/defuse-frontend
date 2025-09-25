import { useEffect, useState } from "react"
import { useModalStore } from "../providers/ModalStoreProvider"
import type { ModalType } from "../stores/modalStore"

export const useModalController = <T extends { modalType: ModalType }>(
  modalType: ModalType
) => {
  const { setModalType, payload } = useModalStore((state) => state)
  const [data, setData] = useState<T | undefined>(undefined)

  useEffect(() => {
    if (!payload || typeof payload !== "object" || !("modalType" in payload)) {
      return
    }
    if (payload.modalType !== modalType) {
      return
    }
    const { modalType: payloadModalType } = payload as T

    if (payloadModalType === modalType) {
      setData(payload as T)
    }
  }, [payload, modalType])

  return {
    setModalType,
    data,
  }
}
