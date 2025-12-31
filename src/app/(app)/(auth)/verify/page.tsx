"use client"

import { ArrowLeftIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import OTPInput from "@src/components/OTPInput"
import useVerifyEmail from "@src/hooks/useVerifyEmail"
import { useRouter, useSearchParams } from "next/navigation"

export default function VerifyPage() {
  const { verifyEmailAddress, verifying, error } = useVerifyEmail()
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="max-w-sm w-full flex flex-col items-center">
        <div className="flex items-center justify-center size-20 bg-gray-100 rounded-2xl mx-auto">
          logo
        </div>

        <h1 className="mt-12 text-3xl font-bold text-gray-900 text-center text-balance leading-[1.1] tracking-tight">
          Check your email
        </h1>
        <p className="text-center text-base text-gray-500 mt-4 text-balance">
          We sent a verification code to {email}. Please enter it below.
        </p>

        <OTPInput
          loading={verifying}
          error={error}
          onComplete={verifyEmailAddress}
          className="mt-8"
        />

        <Button
          size="lg"
          variant="secondary"
          className="mt-8"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon className="size-5" />
          Back
        </Button>
      </div>
    </div>
  )
}
