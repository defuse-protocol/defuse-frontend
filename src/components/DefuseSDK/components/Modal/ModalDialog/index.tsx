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
  ignoreSidebar = false,
}: PropsWithChildren<{
  open: boolean
  title?: ReactNode
  back?: () => void
  onClose?: () => void
  onCloseAnimationEnd?: () => void
  isDismissable?: boolean
  status?: "success" | "error"
  ignoreSidebar?: boolean
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
            "fixed inset-0 bg-fg/80 dark:bg-gray-900/80 duration-200",

            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:ease-out",

            "data-[state=closed]:animate-out data-[state=closed]:ease-in data-[state=closed]:fade-out"
          )}
          onAnimationEnd={() => {
            if (!open && onCloseAnimationEnd) {
              onCloseAnimationEnd()
            }
          }}
        />

        <Dialog.Content
          className="fixed inset-0 z-10 w-screen overflow-y-auto"
          // Disable default "click outside to close" - we handle it manually below
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          <div
            role="presentation"
            className={clsx(
              "flex min-h-full items-end justify-center p-4 text-center sm:items-start sm:p-0 sm:pt-[10vh]",
              !ignoreSidebar && "lg:pl-74"
            )}
            onClick={() => isDismissable && onClose?.()}
            onKeyDown={() => {}}
          >
            <div
              role="presentation"
              className="relative transform overflow-hidden rounded-3xl bg-surface-overlay p-5 text-left shadow-xl transition-all w-full max-w-sm sm:my-8"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
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
                      "-mr-2.5": isDismissable,
                      "-ml-2.5": back,
                    }
                  )}
                >
                  {back && (
                    <button
                      type="button"
                      onClick={back}
                      className="size-10 rounded-xl hover:bg-fg/5 text-fg-secondary hover:text-fg flex items-center justify-center"
                    >
                      <span className="sr-only">Back</span>
                      <ArrowLeftIcon className="size-5" />
                    </button>
                  )}
                  <Dialog.Title className="text-base font-semibold text-fg">
                    {title}
                  </Dialog.Title>
                  {isDismissable && (
                    <Dialog.Close className="size-10 rounded-xl hover:bg-fg/5 text-fg-secondary hover:text-fg flex items-center justify-center">
                      <XMarkIcon className="size-5" />
                    </Dialog.Close>
                  )}
                </div>

                {children}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
