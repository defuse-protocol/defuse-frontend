import { logger } from "@src/utils/logger"
import { Err, Ok, type Result } from "@thames/monads"

type ValidateUsernameErrorType =
  | "This username is already taken."
  | "Unable to verify username. Please try again."
  | "Invalid username format."

// Cache for validation results to prevent API spam
const validationCache = new Map<
  string,
  {
    result: Result<boolean, ValidateUsernameErrorType>
    timestamp: number
  }
>()
const CACHE_TTL = 60000 // 1 minute TTL

function cleanupExpiredCache() {
  const now = Date.now()
  for (const [key, value] of validationCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      validationCache.delete(key)
    }
  }
}

export async function validateAndCacheUsername(
  username: string
): Promise<Result<boolean, ValidateUsernameErrorType>> {
  const now = Date.now()
  const cacheKey = username.toLowerCase()

  // Clean up expired entries periodically (approximately every 10th call)
  if (validationCache.size > 0 && Math.random() < 0.1) {
    cleanupExpiredCache()
  }

  const cached = validationCache.get(cacheKey)
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.result
  }

  const result = await checkUsernameAvailability(username)
  validationCache.set(cacheKey, { result, timestamp: now })
  return result
}

async function checkUsernameAvailability(
  username: string
): Promise<Result<boolean, ValidateUsernameErrorType>> {
  try {
    // API expects tag to start with "@"
    const tag = username.startsWith("@") ? username : `@${username}`
    const encodedTag = encodeURIComponent(tag)

    const response = await fetch(`/api/tags/${encodedTag}`)

    if (response.status === 404) {
      // Username is available (not taken)
      return Ok(true)
    }

    if (response.status === 200) {
      // Username is already taken
      return Err("This username is already taken.")
    }

    if (response.status === 400) {
      // Invalid username format
      return Err("Invalid username format.")
    }

    // Handle other status codes
    logger.warn("Unexpected status when checking username", {
      username,
      status: response.status,
    })
    return Err("Unable to verify username. Please try again.")
  } catch (error: unknown) {
    logger.warn("Failed to check username availability", {
      cause: error,
      username,
    })
    return Err("Unable to verify username. Please try again.")
  }
}

export async function createUsername(
  username: string,
  authIdentifier: string,
  authMethod: string
): Promise<Result<boolean, ValidateUsernameErrorType>> {
  try {
    const authTag = `@${username.trim()}`
    const validationResult = await validateAndCacheUsername(authTag)
    if (validationResult.isErr()) {
      return Err(validationResult.unwrapErr())
    }

    const response = await fetch("/api/tags/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_tag: authTag,
        auth_identifier: authIdentifier,
        auth_method: authMethod,
      }),
    })

    if (!response.ok) {
      if (response.status === 409) {
        return Err("This username is already taken.")
      }
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.error?.[0]?.message) {
          return Err(errorData.error[0].message)
        }
        return Err("Invalid username format.")
      }
      return Err("Unable to verify username. Please try again.")
    }

    return Ok(true)
  } catch (error: unknown) {
    logger.warn("Failed to create username", {
      cause: error,
      username,
    })
    return Err("Unable to verify username. Please try again.")
  }
}
