import type { GetGiftResponse } from "@src/features/gift/types/giftTypes"
import { giftIdSchema } from "@src/features/gift/validation/giftIdSchema"
import { supabase } from "@src/libs/supabase"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ giftId: string }> }
) {
  try {
    const { giftId } = await params
    const validatedData = giftIdSchema.parse(giftId)

    const { data, error } = await supabase
      .from("gifts")
      .select("encrypted_payload, p_key, expires_at")
      .eq("gift_id", validatedData)
      .maybeSingle()

    if (error) {
      logger.error(error)
      return NextResponse.json(
        { error: "Failed to fetch gift" },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    return NextResponse.json({
      encrypted_payload: data.encrypted_payload,
      p_key: data.p_key,
      expires_at: data.expires_at ? new Date(data.expires_at).getTime() : null,
    } satisfies GetGiftResponse)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    logger.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const patchSchema = z.object({
  expires_at: z
    .union([
      z
        .number()
        .int()
        .refine((val) => val > Date.now(), "Expiration must be in the future"),
      z.null(),
    ])
    .optional()
    .transform((val) => val ?? null),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ giftId: string }> }
) {
  try {
    const { giftId } = await params
    const validatedGiftId = giftIdSchema.parse(giftId)

    const body = await request.json()
    const validatedData = patchSchema.parse(body)

    const { error } = await supabase
      .from("gifts")
      .update({
        expires_at: validatedData.expires_at
          ? new Date(validatedData.expires_at).toISOString()
          : null,
      })
      .eq("gift_id", validatedGiftId)

    if (error) {
      logger.error(error)
      return NextResponse.json(
        { error: "Failed to update gift" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    logger.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
