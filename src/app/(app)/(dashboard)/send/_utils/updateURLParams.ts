import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import type { ReadonlyURLSearchParams } from "next/navigation"

export function updateURLParamsWithdraw({
  token,
  network,
  contactId,
  recipient,
  router,
  searchParams,
}: {
  token: string | null
  network: string
  contactId: string | null | undefined
  recipient: string | null | undefined
  router: AppRouterInstance
  searchParams: ReadonlyURLSearchParams
}) {
  const params = new URLSearchParams(searchParams.toString())

  if (token) {
    params.set("token", token)
  } else {
    params.delete("token")
  }

  if (network) {
    params.set("network", network)
  } else {
    params.delete("network")
  }

  if (contactId !== undefined) {
    if (contactId) {
      params.set("contactId", contactId)
      params.delete("recipient")
    } else {
      params.delete("contactId")
    }
  }

  if (recipient !== undefined) {
    if (recipient && !params.has("contactId")) {
      params.set("recipient", recipient)
    } else if (!recipient) {
      params.delete("recipient")
    }
  }

  if (params.toString() !== searchParams.toString()) {
    router.replace(`?${params.toString()}`, { scroll: false })
  }
}
