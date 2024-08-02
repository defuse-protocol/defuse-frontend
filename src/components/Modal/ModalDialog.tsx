import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { Dialog } from "@radix-ui/themes"

import { useModalStore } from "@src/providers/ModalStoreProvider"
import useResize from "@src/hooks/useResize"

interface ModalDialogProps {
  allowOtherModals?: boolean
}

const ModalDialog = ({
  children,
  allowOtherModals,
}: PropsWithChildren<ModalDialogProps>) => {
  const { onCloseModal } = useModalStore((state) => state)
  const [open, setOpen] = useState(true)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const divRef = useRef<HTMLDivElement>(null)
  const { width } = useResize(divRef)

  const defaultMaxWidth = "512px"

  const handleCloseModal = useCallback(() => {
    if (!open) onCloseModal()
  }, [open, onCloseModal])

  useEffect(() => {
    handleCloseModal()
  }, [handleCloseModal])

  useEffect(() => {
    setContainerWidth(divRef.current!.offsetWidth || 0)
    return () => {
      setContainerWidth(0)
    }
  }, [divRef.current, width])

  /** Generic function that prevents any default event behavior. */
  /** For a 3rd party modal to be clickable (like eth wallet adapter)  */
  const avoidDefaultDomBehavior = (e: Event) => {
    e.preventDefault()
  }

  /** For a 3rd party modal to be clickable (like eth wallet adapter)  */
  useEffect(() => {
    if (allowOtherModals) {
      // Pushing the change to the end of the call stack
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = ""
      }, 0)

      return () => clearTimeout(timer)
    } else {
      document.body.style.pointerEvents = "auto"
    }
  }, [allowOtherModals])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Content
        maxWidth={
          containerWidth
            ? containerWidth < 768
              ? "100%"
              : defaultMaxWidth
            : defaultMaxWidth
        }
        className="p-0 dark:bg-black-800"
        {...(allowOtherModals
          ? {
              onPointerDownOutside: avoidDefaultDomBehavior,
              onInteractOutside: avoidDefaultDomBehavior,
            }
          : {})}
      >
        <div ref={divRef}>{children}</div>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export default ModalDialog
