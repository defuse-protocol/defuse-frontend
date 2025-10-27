import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

export function SwitchToLegacyDeposit() {
  const searchParams = useSearchParams()

  const newSearchParams = useMemo(() => {
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set("not1cs", "true")
    newSearchParams.delete("1cs")
    return newSearchParams
  }, [searchParams])

  return (
    <div className="text-center mb-5">
      Try{" "}
      <Link
        href={`/deposit?${newSearchParams.toString()}`}
        className="underline text-blue-c11"
        prefetch={false}
      >
        switching to legacy deposit
      </Link>{" "}
      if the problem persists
    </div>
  )
}
