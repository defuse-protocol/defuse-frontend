import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import type { ReadonlyURLSearchParams } from "next/navigation"

export function updateURLParamsWithdraw({
  token,
  network,
  removeContactId,
  router,
  searchParams,
}: {
  token: string | null
  network: string
  removeContactId: boolean
  router: AppRouterInstance
  searchParams: ReadonlyURLSearchParams
}) {
  const params = new URLSearchParams(searchParams.toString())

  // Set or delete token
  if (token) {
    params.set("token", token)
  } else {
    params.delete("token")
  }

  // Set or delete network
  if (network) {
    params.set("network", network)
  } else {
    params.delete("network")
  }

  // Remove contactId if user manually edited recipient
  if (removeContactId) {
    params.delete("contactId")
  }

  // Only update if changed
  if (params.toString() !== searchParams.toString()) {
    router.replace(`?${params.toString()}`, { scroll: false })
  }
}
