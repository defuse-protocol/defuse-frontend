"use client"
import Button from "@src/components/Button"
import { PasskeyIcon } from "@src/icons"
import clsx from "clsx"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

interface LoginFormData {
  email: string
}

export default function LoginPage() {
  const router = useRouter()
  const [isAwaitingPasskey, setIsAwaitingPasskey] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>()

  const onEmailSubmit = async ({ email }: LoginFormData) => {
    // TODO: Handle form submission

    await new Promise((resolve) => setTimeout(resolve, 2000))

    router.push(`/verify?email=${encodeURIComponent(email)}`)
  }

  const loginWithPasskey = async () => {
    // TODO: Implement passkey flow

    try {
      setIsAwaitingPasskey(true)
      setPasskeyError(null)

      await new Promise((resolve) => setTimeout(resolve, 2000))

      router.push("/account")
    } catch {
      setPasskeyError("Passkey authentication failed.")
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
          Log in to your account
        </h1>

        <p className="text-center text-base text-gray-500 text-balance mt-4">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-gray-500 hover:text-gray-900 underline"
          >
            Sign up
          </Link>
        </p>

        <Button
          size="xl"
          fullWidth
          className="mt-12"
          disabled={isAwaitingPasskey}
          onClick={loginWithPasskey}
        >
          <PasskeyIcon className="size-5" />
          Continue with passkey
        </Button>

        {passkeyError && (
          <p className="mt-2 text-base text-red-600 font-medium text-center">
            {passkeyError}
          </p>
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
              className="pt-1.5 block w-full text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none text-base leading-none ring-0 border-none p-0"
              {...register("email", {
                required: "Enter your email address.",
              })}
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-base text-red-600 font-medium text-center">
              {errors.email.message}
            </p>
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

        <div className="rounded-2xl bg-gray-100 p-4 w-full mt-8">
          <p className="text-sm text-gray-700 text-center">
            Existing web3 wallet user?{" "}
            <Link
              href="/login/wallet"
              className="font-medium whitespace-nowrap text-gray-700 hover:text-gray-900 underline"
            >
              Connect your wallet
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
