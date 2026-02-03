import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/20/solid"
import clsx from "clsx"
import { Dialog } from "radix-ui"
import type { ReactNode } from "react"
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
  back,
  children,
  onClose,
  onCloseAnimationEnd,
  isDismissable = true,
  status = undefined,
}: PropsWithChildren<{
  open: boolean
  title?: ReactNode
  back?: () => void
  onClose?: () => void
  onCloseAnimationEnd?: () => void
  isDismissable?: boolean
  status?: "success" | "error"
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
            "fixed inset-0 bg-gray-900/80 duration-200",

            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:ease-out",

            "data-[state=closed]:animate-out data-[state=closed]:ease-in data-[state=closed]:fade-out"
          )}
          onAnimationEnd={() => {
            if (!open && onCloseAnimationEnd) {
              onCloseAnimationEnd()
            }
          }}
        >
          <div className="fixed inset-0 z-20 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-2 text-center sm:items-start sm:p-0 lg:pl-74 sm:pt-[10vh]">
              <Dialog.Content
                className={clsx(
                  "relative transform overflow-hidden rounded-3xl bg-white px-2 pb-2 pt-5 sm:p-5 text-left shadow-xl duration-200",

                  "sm:my-8 w-full sm:max-w-sm",

                  "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 fade-in data-[state=open]:ease-out data-[state=open]:zoom-in-97",

                  "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-2 fade-out data-[state=closed]:ease-in data-[state=closed]:zoom-out-97"
                )}
                onOpenAutoFocus={(e) => {
                  // This is a workaround for focusing the first input in the modal
                  // Focusing first input is annoying for mobile users
                  e.preventDefault()
                }}
                // Suppressing the warning about missing aria-describedby
                aria-describedby={undefined}
              >
                {status && (
                  <div
                    className={clsx(
                      "absolute top-0 inset-x-0 h-32 bg-linear-to-b",
                      {
                        "from-green-50 to-green-50/0": status === "success",
                        "from-red-50 to-red-50/0": status === "error",
                      }
                    )}
                  />
                )}
                <div className="relative">
                  <div
                    className={clsx(
                      "flex items-center justify-between min-h-10 -mt-2.5",
                      {
                        "sm:-mr-2.5": isDismissable,
                        "sm:-ml-2.5": back,
                      }
                    )}
                  >
                    {back && (
                      <button
                        type="button"
                        onClick={back}
                        className="size-10 rounded-xl hover:bg-gray-900/5 text-gray-600 hover:text-gray-900 flex items-center justify-center"
                      >
                        <span className="sr-only">Back</span>
                        <ArrowLeftIcon className="size-5" />
                      </button>
                    )}
                    <Dialog.Title className="text-base font-semibold text-gray-900">
                      {title}
                    </Dialog.Title>
                    {isDismissable && (
                      <Dialog.Close
                        onClick={onClose}
                        className="size-10 rounded-xl hover:bg-gray-900/5 text-gray-600 hover:text-gray-900 flex items-center justify-center"
                      >
                        <XMarkIcon className="size-5" />
                      </Dialog.Close>
                    )}
                  </div>

                  {children}
                </div>
              </Dialog.Content>
            </div>
          </div>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
