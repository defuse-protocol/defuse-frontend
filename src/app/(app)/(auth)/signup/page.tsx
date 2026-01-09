"use client"

import Button from "@src/components/Button"
import ErrorMessage from "@src/components/ErrorMessage"
import { PasskeyIcon } from "@src/icons"
import { useTurnkey } from "@turnkey/react-wallet-kit"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passkeyName, setPasskeyName] = useState("")
  const {
    signUpWithPasskey,
    loginWithPasskey,
    createWallet,
    session,
    wallets,
  } = useTurnkey()

  // Redirect if already logged in
  const walletAddress = wallets?.[0]?.accounts?.[0]?.address
  useEffect(() => {
    if (session && walletAddress) {
      router.push("/account")
    }
  }, [session, walletAddress, router])

  const handleSignup = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await signUpWithPasskey({
        passkeyDisplayName: passkeyName.trim() || undefined,
      })
      // Fresh signup always has 0 wallets - create one
      await createWallet({
        walletName: "Default Wallet",
        accounts: ["ADDRESS_FORMAT_ETHEREUM"],
      })
      router.push("/account")
    } catch {
      setError("Failed to create account.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await loginWithPasskey()
      // useEffect handles redirect when session/wallet updates
    } catch {
      setError("Failed to log in.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="max-w-sm w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-900 text-center text-balance leading-[1.1] tracking-tight">
          Welcome
        </h1>

        <p className="text-center text-base text-gray-500 text-balance mt-4">
          Create an account or log in with your passkey
        </p>

        <input
          type="text"
          placeholder="Your username"
          value={passkeyName}
          onChange={(e) => setPasskeyName(e.target.value)}
          disabled={isLoading}
          className="w-full mt-12 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900"
        />

        <Button
          size="xl"
          fullWidth
          className="mt-3"
          disabled={isLoading}
          onClick={handleSignup}
        >
          <PasskeyIcon className="size-5" />
          Create account
        </Button>

        {error && (
          <ErrorMessage className="mt-2 text-center">{error}</ErrorMessage>
        )}

        <div className="my-8 flex items-center gap-x-6 w-full">
          <div className="w-full flex-1 border-t border-gray-200" />
          <p className="text-xs font-semibold text-nowrap text-gray-500 uppercase">
            Or
          </p>
          <div className="w-full flex-1 border-t border-gray-200" />
        </div>

        <Button
          size="xl"
          fullWidth
          variant="secondary"
          disabled={isLoading}
          onClick={handleLogin}
        >
          <PasskeyIcon className="size-5" />
          Log in
        </Button>

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
