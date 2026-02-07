import { CheckIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import ErrorMessage from "@src/components/ErrorMessage"
import OTPInput from "@src/components/OTPInput"
import useVerifyEmail from "@src/hooks/useVerifyEmail"
import clsx from "clsx"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { BaseModalDialog } from "./ModalDialog"

interface FormData {
  email: string
}

const title = {
  email: "Add email",
  verify: "Check your email",
  success: "",
}

const ModalAddEmail = ({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) => {
  const { verifyEmailAddress, verifying, error } = useVerifyEmail({
    onSuccess: () => setStep("success"),
  })
  const [step, setStep] = useState<"email" | "verify" | "success">("email")

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>()

  const email = watch("email")

  const onEmailSubmit = async ({ email: _email }: FormData) => {
    // TODO: Handle form submission

    await new Promise((resolve) => setTimeout(resolve, 2000))

    setStep("verify")
  }

  return (
    <BaseModalDialog
      title={title[step]}
      status={step === "success" ? "success" : undefined}
      open={open}
      onClose={onClose}
      onCloseAnimationEnd={() => {
        setStep("email")
        reset()
      }}
    >
      {step === "email" ? (
        <>
          <p className="text-sm text-fg-secondary mt-1 font-medium">
            Enter the email address you want to add to your account. We'll send
            a confirmation code to your email.
          </p>
          <form onSubmit={handleSubmit(onEmailSubmit)} className="mt-4">
            <div
              className={clsx(
                "rounded-2xl bg-surface-card px-4 py-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2",
                errors.email
                  ? "outline-red-500 focus-within:outline-red-500"
                  : "outline-border focus-within:outline-fg"
              )}
            >
              <label
                htmlFor="email"
                className="block text-sm text-fg-secondary leading-none"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                autoComplete="email"
                className="pt-1.5 block w-full text-fg font-medium placeholder:text-fg-tertiary focus:outline-none text-base leading-none ring-0 border-none p-0"
                {...register("email", {
                  required: "Enter your email address.",
                })}
              />
            </div>
            {errors.email && (
              <ErrorMessage className="mt-2 text-center">
                {errors.email.message}
              </ErrorMessage>
            )}

            <Button
              type="submit"
              size="xl"
              fullWidth
              className="mt-3"
              loading={isSubmitting}
            >
              Send confirmation code
            </Button>
          </form>
        </>
      ) : step === "verify" ? (
        <>
          <p className="text-sm text-fg-secondary mt-1 font-medium">
            We've sent a confirmation code to {email}. Please enter it below.
          </p>
          <OTPInput
            loading={verifying}
            error={error}
            onComplete={verifyEmailAddress}
            className="mt-8"
          />
        </>
      ) : step === "success" ? (
        <div className="flex flex-col items-center justify-center">
          <div className="size-13 flex items-center justify-center shrink-0 bg-green-100 rounded-full">
            <CheckIcon className="size-6 text-green-600" />
          </div>
          <h2 className="mt-5 text-2xl text-center text-fg font-bold tracking-tight leading-[1.1]">
            Email added
          </h2>
          <p className="text-base/5 text-center font-medium text-fg-secondary mt-1 text-balance">
            The email address has been added to your account.
          </p>
          <Button size="xl" fullWidth className="mt-8" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : null}
    </BaseModalDialog>
  )
}

export default ModalAddEmail
