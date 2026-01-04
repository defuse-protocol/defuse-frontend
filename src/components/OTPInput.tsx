import clsx from "clsx"
import { OTPInput as OTPInputComponent } from "input-otp"
import ErrorMessage from "./ErrorMessage"
import Spinner from "./Spinner"

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

const OTPInput = ({
  loading,
  error,
  onComplete,
  className,
}: {
  loading: boolean
  error: string | null
  onComplete: (otp: string) => void
  className?: string
}) => (
  <>
    <OTPInputComponent
      maxLength={6}
      disabled={loading}
      pushPasswordManagerStrategy="none"
      data-lpignore="true"
      data-1p-ignore="true"
      containerClassName={clsx(
        "group flex justify-center gap-x-1 sm:gap-x-2",
        loading && "opacity-50",
        className
      )}
      onComplete={(otp) => onComplete(otp)}
      render={({ slots }) =>
        slots.map((slot, idx) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Fixed-length OTP slots with stable positions
          <Slot key={idx} {...slot} disabled={loading} />
        ))
      }
    />
    <div className="mt-3 h-6 flex items-center justify-center">
      {loading ? (
        <div className="flex items-center gap-x-3">
          <p className="text-center text-sm/5 text-balance text-gray-500 font-medium">
            Verifying code
          </p>
          <Spinner size="sm" />
        </div>
      ) : error ? (
        <ErrorMessage className="text-center text-balance">
          {error}
        </ErrorMessage>
      ) : null}
    </div>
  </>
)

export default OTPInput
