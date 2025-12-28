"use client"

import { ArrowLeftIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import Spinner from "@src/components/Spinner"
import clsx from "clsx"
import { OTPInput } from "input-otp"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

const Slot = ({
  char,
  isActive,
  disabled,
}: {
  char: string | null
  isActive: boolean
  disabled: boolean
}) => (
  <div
    className={clsx(
      "flex size-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl font-bold sm:size-14",
      {
        "outline-gray-900 outline-2 -outline-offset-2": isActive && !disabled,
      }
    )}
  >
    {char !== null && char}
  </div>
)

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  const [verifying, setVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  )

  const handleVerify = async (_otp: string) => {
    try {
      // TODO: Implement OTP verification

      setVerifying(true)
      setVerificationError(null)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch {
      setVerificationError("Verification failed.")
    } finally {
      setVerifying(false)
    }
  }

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
          maxLength={6}
          disabled={verifying}
          pushPasswordManagerStrategy="none"
          data-lpignore="true"
          data-1p-ignore="true"
          containerClassName={clsx(
            "group mt-8 flex justify-center gap-x-1 sm:gap-x-2",
            verifying && "opacity-50"
          )}
          onComplete={(otp) => handleVerify(otp)}
          render={({ slots }) =>
            slots.map((slot, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Fixed-length OTP slots with stable positions
              <Slot key={idx} {...slot} disabled={verifying} />
            ))
          }
        />

        <div className="mt-4 h-6">
          {verifying ? (
            <div className="flex items-center gap-x-3">
              <p className="text-center text-base text-balance text-gray-600 font-medium">
                Verifying code
              </p>
              <Spinner size="sm" />
            </div>
          ) : (
            <p className="text-center text-base text-balance text-red-600 font-medium">
              {verificationError}
            </p>
          )}
        </div>

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
