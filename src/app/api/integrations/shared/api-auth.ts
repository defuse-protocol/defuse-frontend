import type { JWTPayload } from "jose"
import type { NextRequest } from "next/server"

import { type Result, err, ok } from "./result"
import type { ApiResult, ErrorWithStatus } from "./types"

function extractBearerToken(
  authHeader: string | null | undefined
): Result<string, ErrorWithStatus> {
  if (!authHeader) {
    return err("Bad Request", "Missing authorization header")
  }

  const [tag, token, ...rest] = authHeader.split(" ")

  if (tag !== "Bearer" || token === undefined || rest.length > 0) {
    return err(
      "Bad Request",
      "Invalid authorization header. Expected format: Bearer <token>"
    )
  }

  return ok(token)
}

// function hasKeyType(
//   payload: JWTPayload
// ): payload is JWTPayload & { key_type: string } {
//   return "key_type" in payload
// }

export async function verifyApiKey(
  request: NextRequest
): ApiResult<JWTPayload> {
  try {
    const authHeader = request.headers.get("authorization")
    const tokenResult = extractBearerToken(authHeader)

    if (tokenResult.err) {
      return tokenResult
    }

    const publicKey = process.env.JWT_PUBLIC_KEY

    if (!publicKey) {
      return err("Internal Server Error", "Missing JWT public key")
    }

    // temporary allow only with one password
    if (tokenResult.ok !== process.env.TEMP_API_PASS) {
      return err("Bad Request", "Invalid API key")
    }

    return ok({})

    // try {
    //  const key = await importSPKI(publicKey, "RS256")
    //   const { payload } = await jwtVerify(tokenResult.ok, key)

    //   if (!hasKeyType(payload) || payload.key_type !== "integrations") {
    //     return err(
    //       "Bad Request",
    //       "Expected key_type JWT token field to be 'integrations'"
    //     )
    //   }

    //   return ok(payload)
    // } catch {
    //   return err("Bad Request", "Invalid JWT token")
    // }
  } catch {
    return err("Internal Server Error", "Authentication failed")
  }
}
