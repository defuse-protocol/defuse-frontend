import { Dialog } from "@radix-ui/themes"
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import useScreenWidth from "@src/hooks/useScreenWidth"
import { useModalStore } from "@src/providers/ModalStoreProvider"

const ModalDialog = ({ children }: PropsWithChildren) => {
  const { onCloseModal } = useModalStore((state) => state)
  const [open, setOpen] = useState(true)
  const containerWidthRef = useRef(0)
  const divRef = useRef<HTMLDivElement>(null)
  const screenWidth = useScreenWidth()

  const defaultMaxWidth = "512px"

  const handleCloseModal = useCallback(() => {
    if (!open) onCloseModal()
  }, [open, onCloseModal])

  useEffect(() => {
    handleCloseModal()
  }, [handleCloseModal])

  useEffect(() => {
    const offsetWidth = divRef.current?.offsetWidth
    if (offsetWidth) {
      containerWidthRef.current = divRef.current.offsetWidth
    }
    return () => {
      containerWidthRef.current = 0
    }
  }, [])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Title />
      <Dialog.Content
        maxWidth={screenWidth < 768 ? "100%" : defaultMaxWidth}
        className="px-0 pt-0 pb-[env(safe-area-inset-bottom,0px)] dark:bg-black-800"
      >
        <div ref={divRef}>{children}</div>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export default ModalDialog
