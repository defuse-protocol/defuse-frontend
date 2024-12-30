"use client"

import { useSentrySetUser } from "@src/hooks/useSetSentry"

export const SentryTracer = () => {
  useSentrySetUser()
  return null
}
