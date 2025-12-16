import { X as CrossIcon } from "@phosphor-icons/react"
import * as Dialog from "@radix-ui/react-dialog"
import { Theme } from "@radix-ui/themes"
import clsx from "clsx"
import { type PropsWithChildren, useCallback, useEffect, useState } from "react"

import { useModalStore } from "../../../providers/ModalStoreProvider"

export const ModalDialog = ({
  children,
  onClose,
  isDismissable,
}: PropsWithChildren<{
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
      isDismissable={isDismissable}
    >
      {children}
    </BaseModalDialog>
  )
}

export function BaseModalDialog({
  open,
  children,
  onClose,
  onCloseAnimationEnd,
  isDismissable,
}: PropsWithChildren<{
  open: boolean
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
        <Theme asChild>
          <Dialog.Overlay
            className={clsx(
              "fixed inset-0 z-50 bg-gray-a8",
              // Backdrop animation forces the dialog to animate
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            )}
            onAnimationEnd={() => {
              if (!open && onCloseAnimationEnd) {
                onCloseAnimationEnd()
              }
            }}
          >
            <div className="flex absolute bottom-0 left-0 right-0 md:inset-0 overflow-y-auto overflow-x-hidden">
              <div className="grow md:m-auto md:py-8 md:px-4">
                <Dialog.Content
                  className={clsx(
                    "relative m-auto w-full max-w-[100vw] md:w-[90vw] md:max-w-[472px] overflow-x-hidden min-w-0",
                    "bg-gray-1 shadow-lg focus:outline-hidden",
                    "rounded-t-2xl md:rounded-2xl",
                    "max-md:max-h-[70vh]",
                    "[--inset-padding-top:--spacing(5)]",
                    "[--inset-padding-right:--spacing(5)]",
                    "[--inset-padding-bottom:max(env(safe-area-inset-bottom,0px),--spacing(5))]",
                    "[--inset-padding-left:--spacing(5)]",
                    "pt-(--inset-padding-top) pr-(--inset-padding-right) pb-(--inset-padding-bottom) pl-(--inset-padding-left)",

                    // Animation
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=open]:duration-300 data-[state=closed]:duration-200",
                    "data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full",
                    "md:data-[state=open]:slide-in-from-top-4 md:data-[state=closed]:slide-out-to-bottom-4",
                    "md:data-[state=open]:zoom-in-95 md:data-[state=closed]:zoom-out-95",
                    "md:data-[state=open]:fade-in md:data-[state=closed]:fade-out"
                  )}
                  onOpenAutoFocus={(e) => {
                    // This is a workaround for focusing the first input in the modal
                    // Focusing first input is annoying for mobile users
                    e.preventDefault()
                  }}
                  // Suppressing the warning about missing aria-describedby
                  aria-describedby={undefined}
                >
                  <Dialog.Title />

                  {isDismissable && (
                    <Dialog.Close className="flex items-center justify-center absolute top-5 right-5 size-10 rounded-full hover:bg-gray-3 active:bg-gray-4">
                      <CrossIcon weight="bold" className="size-5" />
                    </Dialog.Close>
                  )}

                  <div>{children}</div>
                </Dialog.Content>
              </div>
            </div>
          </Dialog.Overlay>
        </Theme>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
