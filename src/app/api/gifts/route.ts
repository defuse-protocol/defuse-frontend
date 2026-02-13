import { base64 } from "@scure/base"
import { base64urlnopad } from "@scure/base"
import type {
  CreateGiftRequest,
  CreateGiftResponse,
  ErrorResponse,
} from "@src/features/gift/types/giftTypes"
import { supabase } from "@src/libs/supabase"
import { verifyAppAuthToken } from "@src/utils/authJwt"
import { logger } from "@src/utils/logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { giftIdSchema } from "./_validation"

const giftsSchema = z.object({
  gift_id: giftIdSchema,
  encrypted_payload: z.string().refine((val) => {
    try {
      const decoded = base64.decode(val)
      return decoded.length >= 64
    } catch (_err) {
      return false
    }
  }, "Invalid encrypted_payload format"),
  p_key: z.string().refine((val) => {
    try {
      const keyBytes = base64urlnopad.decode(val)
      return keyBytes.length === 32
    } catch {
      return false
    }
  }, "Key must be exactly 32 bytes (AES-256)"),
}) as z.ZodType<CreateGiftRequest>

async function verifyAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const activeWallet = cookieStore.get("defuse_active_wallet")?.value
  if (!activeWallet) return false

  const { createHash } = await import("node:crypto")
  const hashHex = createHash("sha256")
    .update(activeWallet, "utf8")
    .digest("hex")
  const cookieKey = `defuse_auth_${hashHex.slice(0, 16)}`
  const token = cookieStore.get(cookieKey)?.value
  if (!token) return false

  const payload = await verifyAppAuthToken(token)
  return payload != null
}

export async function POST(request: Request) {
  try {
    const isAuthed = await verifyAuth()
    if (!isAuthed) {
      return NextResponse.json(
        { error: "Unauthorized" } satisfies ErrorResponse,
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = giftsSchema.parse(body)
    const { error } = await supabase.from("gifts").insert(validatedData)

    if (error) {
      logger.error(error)
      return NextResponse.json(
        {
          error: "Failed to create gift",
        } satisfies ErrorResponse,
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
      } satisfies CreateGiftResponse,
      {
        status: 201,
      }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors } satisfies ErrorResponse,
        { status: 400 }
      )
    }

    logger.error(error)
    return NextResponse.json(
      { error: "Internal server error" } satisfies ErrorResponse,
      { status: 500 }
    )
  }
}
