"use client"

import type { ReactNode } from "react"

import { WebAuthnDialog } from "@src/features/webauthn/components/WebAuthnDialog"

export function WebAuthnProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <WebAuthnDialog />
    </>
  )
}
