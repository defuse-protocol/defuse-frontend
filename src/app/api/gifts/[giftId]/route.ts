import type { GetGiftResponse } from "@src/features/gift/types/giftTypes"
import { supabase } from "@src/libs/supabase"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"

const giftIdSchema = z
  .string()
  .uuid()
  .refine((val) => {
    // UUID v5 has version bits set to 5 (0101)
    return val[14] === "5"
  }, "Invalid gift_id format") as z.ZodType<string>

export async function GET(
  request: Request,
  { params }: { params: Promise<{ giftId: string }> }
) {
  try {
    const { giftId } = await params
    const validatedData = giftIdSchema.parse(giftId)

    const { data, error } = await supabase
      .from("gifts")
      .select("encrypted_payload, p_key")
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
      return NextResponse.json(
        { error: "Otc trade not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      encrypted_payload: data.encrypted_payload,
      p_key: data.p_key,
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
