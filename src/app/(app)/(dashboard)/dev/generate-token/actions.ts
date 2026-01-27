"use server"

import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { generateAppAuthToken } from "@src/utils/authJwt"
import { cookies } from "next/headers"

const AUTH_TOKEN_KEY = "defuse_auth_token"

export async function generateToken(
  authIdentifier: string,
  authMethod: AuthMethod
): Promise<string> {
  const token = await generateAppAuthToken(authIdentifier, authMethod)

  // Set the token in cookies so server actions can access it
  const cookieStore = await cookies()
  cookieStore.set(AUTH_TOKEN_KEY, token, {
    httpOnly: false, // Allow client-side access if needed
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  })

  return token
}
