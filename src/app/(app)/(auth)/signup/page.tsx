"use client"

import Button from "@src/components/Button"
import ErrorMessage from "@src/components/ErrorMessage"
import { PasskeyIcon } from "@src/icons"
import clsx from "clsx"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

interface SignupFormData {
  email: string
}

export default function SignupPage() {
  const router = useRouter()
  const [isAwaitingPasskey, setIsAwaitingPasskey] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>()

  const onEmailSubmit = async ({ email }: SignupFormData) => {
    // TODO: Handle form submission

    await new Promise((resolve) => setTimeout(resolve, 2000))

    router.push(`/verify?email=${encodeURIComponent(email)}`)
  }

  const registerWithPasskey = async () => {
    // TODO: Implement passkey flow

    try {
      setIsAwaitingPasskey(true)
      setPasskeyError(null)

      await new Promise((resolve) => setTimeout(resolve, 2000))

      router.push("/account")
    } catch {
      setPasskeyError("Passkey failed.")
    } finally {
      setIsAwaitingPasskey(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="max-w-sm w-full flex flex-col items-center">
        <div className="flex items-center justify-center size-20 bg-gray-100 rounded-2xl mx-auto">
          logo
        </div>

        <h1 className="mt-12 text-3xl font-bold text-gray-900 text-center text-balance leading-[1.1] tracking-tight">
          Create account
        </h1>

        <p className="text-center text-base text-gray-500 text-balance mt-4">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-gray-500 hover:text-gray-900 underline"
          >
            Log in
          </Link>
        </p>

        <Button
          size="xl"
          fullWidth
          className="mt-12"
          disabled={isAwaitingPasskey}
          onClick={registerWithPasskey}
        >
          <PasskeyIcon className="size-5" />
          Continue with passkey
        </Button>

        {passkeyError && (
          <ErrorMessage className="mt-2 text-center">
            {passkeyError}
          </ErrorMessage>
        )}

        <div className="my-8 flex items-center gap-x-6 w-full">
          <div className="w-full flex-1 border-t border-gray-200" />
          <p className="text-xs font-semibold text-nowrap text-gray-500 uppercase">
            Or
          </p>
          <div className="w-full flex-1 border-t border-gray-200" />
        </div>

        <form onSubmit={handleSubmit(onEmailSubmit)} className="w-full">
          <div
            className={clsx(
              "rounded-2xl bg-white px-4 py-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2",
              errors.email
                ? "outline-red-500 focus-within:outline-red-500"
                : "outline-gray-200 focus-within:outline-gray-900"
            )}
          >
            <label
              htmlFor="email"
              className="block text-sm text-gray-500 leading-none"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="john@example.com"
              autoComplete="email"
              className="pt-1.5 block w-full text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none text-base leading-none ring-0 border-none p-0"
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
            Continue with email
          </Button>
        </form>

        <p className="mt-8 text-base text-gray-500 text-center text-balance">
          By signing up, you agree to our{" "}
          <Link
            href="/terms-of-service"
            className="text-gray-500 hover:text-gray-900 underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="text-gray-500 hover:text-gray-900 underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
