import {
  type Contact,
  deleteContact,
} from "@src/app/(app)/(auth)/contacts/actions"
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
    if (!contact?.contactId) {
      setError("root", {
        message: "Contact ID is missing. Please try again.",
      })
      return
    }

    try {
      const result = await deleteContact({
        contactId: contact.contactId,
      })

      if (!result.ok) {
        setError("root", {
          message: result.error,
        })
        return
      }

      onClose()
    } catch (error) {
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove contact. Please try again.",
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
        <h2 className="mt-2 text-2xl/7 font-bold text-fg tracking-tight text-center text-balance">
          Remove "{contact?.name}"?
        </h2>
        <p className="mt-2 text-base/5 text-fg-secondary font-medium text-center text-balance">
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
