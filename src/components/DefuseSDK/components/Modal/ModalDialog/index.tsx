import { XMarkIcon } from "@heroicons/react/20/solid"
import clsx from "clsx"
import { Dialog } from "radix-ui"
import { type PropsWithChildren, useCallback, useEffect, useState } from "react"
import { useModalStore } from "../../../providers/ModalStoreProvider"

export const ModalDialog = ({
  title,
  children,
  onClose,
  isDismissable,
}: PropsWithChildren<{
  title: string
  onClose?: () => void
  isDismissable?: boolean
}>) => {
  const { onCloseModal } = useModalStore((state) => state)
  const [open, setOpen] = useState(true)

  const handleCloseModal = useCallback(() => {
    if (!open) {
      onCloseModal()
      onClose?.()
    }
  }, [open, onCloseModal, onClose])

  useEffect(() => {
    handleCloseModal()
  }, [handleCloseModal])

  return (
    <BaseModalDialog
      open={open}
      onClose={() => {
        setOpen(false)
        handleCloseModal()
      }}
      title={title}
      isDismissable={isDismissable}
    >
      {children}
    </BaseModalDialog>
  )
}

export function BaseModalDialog({
  open,
  title,
  children,
  onClose,
  onCloseAnimationEnd,
  isDismissable = true,
}: PropsWithChildren<{
  open: boolean
  title: string
  onClose?: () => void
  onCloseAnimationEnd?: () => void
  isDismissable?: boolean
}>) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onClose?.()
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={clsx(
            "fixed inset-0 bg-gray-900/80",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:duration-300 data-[state=open]:ease-out",
            "data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:ease-in data-[state=closed]:fade-out"
          )}
          onAnimationEnd={() => {
            if (!open && onCloseAnimationEnd) {
              onCloseAnimationEnd()
            }
          }}
        >
          <div className="fixed inset-0 z-20 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-start sm:p-0 sm:pt-[10vh]">
              <Dialog.Content
                className={clsx(
                  "relative transform overflow-hidden rounded-3xl bg-white p-5 text-left shadow-xl",
                  "sm:my-8 sm:w-full sm:max-w-sm",
                  "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 fade-in data-[state=open]:ease-out data-[state=open]:duration-200 data-[state=open]:zoom-in-97",
                  "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-2 fade-out data-[state=closed]:ease-in data-[state=closed]:duration-1000 data-[state=closed]:zoom-in-97"
                )}
                onOpenAutoFocus={(e) => {
                  // This is a workaround for focusing the first input in the modal
                  // Focusing first input is annoying for mobile users
                  e.preventDefault()
                }}
                // Suppressing the warning about missing aria-describedby
                aria-describedby={undefined}
              >
                <div
                  className={clsx(
                    "flex items-center justify-between",
                    isDismissable && "-mt-2.5 -mr-2.5"
                  )}
                >
                  <Dialog.Title className="text-base font-semibold text-gray-900">
                    {title}
                  </Dialog.Title>
                  {isDismissable && (
                    <Dialog.Close
                      onClick={onClose}
                      className="size-10 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 flex items-center justify-center"
                    >
                      <XMarkIcon className="size-5" />
                    </Dialog.Close>
                  )}
                </div>

                {children}
              </Dialog.Content>
            </div>
          </div>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
