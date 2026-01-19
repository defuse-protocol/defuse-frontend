"use server"

import { generateAppAuthToken } from "@src/utils/dummyAuth"

export async function generateToken(
  authIdentifier: string,
  authMethod: string
): Promise<string> {
  return generateAppAuthToken(authIdentifier, authMethod)
}
