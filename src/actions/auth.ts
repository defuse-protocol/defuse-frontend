"use server"

import { generateAppAuthToken, verifyJWT } from "@src/utils/appAuthJwt"
import { logger } from "@src/utils/logger"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { z } from "zod"

const AUTH_TOKEN_KEY = "defuse_auth_token"

const generateTokenSchema = z.object({
  authIdentifier: z.string().min(1, "authIdentifier is required"),
  authMethod: z.string().min(1, "authMethod is required"),
})

/**
 * Generates an app auth token and stores it in cookies
 * @param authIdentifier - The wallet address
 * @param authMethod - The chain type (e.g., "evm", "near", "solana")
 * @returns The generated token
 */
export async function generateAuthToken(
  authIdentifier: string,
  authMethod: string
): Promise<{ token: string }> {
  try {
    const validatedData = generateTokenSchema.parse({
      authIdentifier,
      authMethod,
    })

    const token = await generateAppAuthToken(
      validatedData.authIdentifier,
      validatedData.authMethod
    )

    const cookieStore = await cookies()
    cookieStore.set(AUTH_TOKEN_KEY, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60, // Tempoarty set to 1 minute for testing. It should be 7 days in production.
      path: "/",
    })

    return { token }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("Invalid token generation request", { error: error.errors })
      throw new Error("Invalid request parameters")
    }

    logger.error("Failed to generate app auth token", { error })
    throw new Error("Failed to generate token")
  }
}

/**
 * Checks if the stored token is valid for the given wallet address and chain type
 * @param address - The wallet address to check
 * @param chainType - The chain type to check
 * @returns Object indicating if the token is valid
 */
export async function checkTokenValidity(
  address: string | null | undefined,
  chainType: string | undefined
): Promise<{ isValid: boolean }> {
  if (!address || !chainType) {
    return { isValid: false }
  }

  try {
    const cookieStore = await cookies()
    const storedToken = cookieStore.get(AUTH_TOKEN_KEY)?.value

    if (!storedToken) {
      return { isValid: false }
    }

    const payload = await verifyJWT(storedToken)
    if (!payload) {
      return { isValid: false }
    }

    const addressMatches = payload.auth_identifier === address
    const chainTypeMatches = payload.auth_method === chainType

    if (!addressMatches || !chainTypeMatches) {
      logger.warn("Token claims do not match current wallet", {
        tokenAddress: payload.auth_identifier,
        currentAddress: address,
        tokenChainType: payload.auth_method,
        currentChainType: chainType,
      })
      return { isValid: false }
    }

    return { isValid: true }
  } catch (error) {
    logger.error("Failed to check token validity", { error })
    return { isValid: false }
  }
}

/**
 * Removes the auth token cookie on sign out
 */
export async function clearAuthToken(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(AUTH_TOKEN_KEY)

    revalidatePath("/", "layout")
  } catch (error) {
    logger.error("Failed to clear auth token", { error })
  }
}
