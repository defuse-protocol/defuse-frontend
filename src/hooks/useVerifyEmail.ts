import { useState } from "react"

const useVerifyEmail = ({ onSuccess }: { onSuccess: () => void }) => {
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verifyEmailAddress = async (_otp: string) => {
    try {
      // TODO: Implement OTP verification

      setVerifying(true)
      setError(null)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      onSuccess()
    } catch {
      setError("Verification failed.")
    } finally {
      setVerifying(false)
    }
  }

  return {
    verifyEmailAddress,
    verifying,
    error,
  }
}

export default useVerifyEmail
