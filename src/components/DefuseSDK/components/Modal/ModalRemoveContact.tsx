import type { Contact } from "@src/app/(app)/(dashboard)/contacts/page"
import Button from "@src/components/Button"
import ErrorMessage from "@src/components/ErrorMessage"
import { useForm } from "react-hook-form"
import { BaseModalDialog } from "./ModalDialog"

type ModalContactProps = {
  open: boolean
  contact: Contact | null
  onClose: () => void
  onCloseAnimationEnd?: () => void
}

const ModalRemoveContact = ({
  open,
  onClose,
  onCloseAnimationEnd,
  contact,
}: ModalContactProps) => {
  const {
    handleSubmit,
    setError,
    reset,
    formState: { isSubmitting, errors },
  } = useForm()

  const onSubmit = async () => {
    try {
      // TODO: Remove contact
      await new Promise((resolve) => setTimeout(resolve, 2000))

      onClose()
      // TODO: Add success toast
    } catch {
      setError("root", {
        message: "Failed to remove contact. Please try again.",
      })
    }
  }

  return (
    <BaseModalDialog
      open={open}
      onClose={onClose}
      onCloseAnimationEnd={() => {
        reset()
        onCloseAnimationEnd?.()
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <h2 className="mt-2 text-2xl/7 font-bold text-gray-900 tracking-tight text-center text-balance">
          Remove "{contact?.name}"?
        </h2>
        <p className="mt-2 text-base/5 text-gray-500 font-medium text-center text-balance">
          This contact will be removed from your saved contacts. You can add it
          again anytime.
        </p>

        <div className="grid grid-cols-2 gap-1 mt-8">
          <Button
            type="button"
            variant="secondary"
            size="xl"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="destructive"
            size="xl"
            loading={isSubmitting}
          >
            Remove
          </Button>
        </div>

        {errors.root && (
          <ErrorMessage className="mt-4 text-center">
            {errors.root.message}
          </ErrorMessage>
        )}
      </form>
    </BaseModalDialog>
  )
}

export default ModalRemoveContact
