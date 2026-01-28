import { base64 } from "@scure/base"
import { base64urlnopad } from "@scure/base"
import type {
  CreateGiftRequest,
  CreateGiftResponse,
  ErrorResponse,
} from "@src/features/gift/types/giftTypes"
import { giftIdSchema } from "@src/features/gift/validation/giftIdSchema"
import { supabase } from "@src/libs/supabase"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"

const giftsSchema = z.object({
  gift_id: giftIdSchema,
  encrypted_payload: z.string().refine((val) => {
    try {
      const decoded = base64.decode(val)
      // AES-GCM produces variable length output, but should be at least 16 bytes
      return decoded.length >= 16
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
  expires_at: z
    .number()
    .int()
    .refine((val) => val > Date.now(), "Expiration must be in the future")
    .nullable()
    .optional(),
}) as z.ZodType<CreateGiftRequest>

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = giftsSchema.parse(body)
    const { error } = await supabase.from("gifts").insert({
      ...validatedData,
      expires_at: validatedData.expires_at
        ? new Date(validatedData.expires_at).toISOString()
        : null,
    })

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
