import clsx from "clsx"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
import type { ReactNode } from "react"

const AlertDialog = ({
  open,
  children,
}: { open: boolean; children: ReactNode }) => {
  return (
    <AlertDialogPrimitive.Root open={open}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className={clsx(
            "fixed inset-0 bg-gray-900/80",

            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:duration-300 data-[state=open]:ease-out",

            "data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:ease-in data-[state=closed]:fade-out"
          )}
        />

        <div className="fixed inset-0 z-20 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-start sm:p-0 lg:pl-74 sm:pt-[10vh]">
            <AlertDialogPrimitive.Content
              className={clsx(
                "relative transform overflow-hidden rounded-3xl bg-white p-5 text-left shadow-xl w-full max-w-sm sm:my-8",

                "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 fade-in data-[state=open]:ease-out data-[state=open]:duration-200 data-[state=open]:zoom-in-97",

                "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-2 fade-out data-[state=closed]:ease-in data-[state=closed]:duration-1000 data-[state=closed]:zoom-in-97"
              )}
            >
              {children}
            </AlertDialogPrimitive.Content>
          </div>
        </div>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

export default AlertDialog

const Title = ({
  children,
  className,
}: { children: ReactNode; className?: string }) => (
  <AlertDialogPrimitive.Title
    className={clsx(
      "text-2xl/7 font-bold tracking-tight text-center",
      className
    )}
  >
    {children}
  </AlertDialogPrimitive.Title>
)

const Description = ({
  children,
  className,
}: { children: ReactNode; className?: string }) => (
  <AlertDialogPrimitive.Description
    className={clsx(
      "text-base/5 font-medium text-gray-500 text-center text-balance",
      className
    )}
  >
    {children}
  </AlertDialogPrimitive.Description>
)

AlertDialog.Title = Title
AlertDialog.Description = Description
