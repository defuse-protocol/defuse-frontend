import { base58 } from "@scure/base"
import type { GetOtcTradeResponse } from "@src/features/otc/types/otcTypes"
import { supabase } from "@src/libs/supabase"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"
import { rawIdSchema } from "../_utils/validation"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ rawId: string }> }
) {
  try {
    const { rawId: rawId_ } = await params
    const rawId = rawIdSchema.parse(rawId_)

    const { data, error } = await supabase
      .from("otc_trades")
      .select("encrypted_payload")
      .eq("raw_id", rawId)
      .maybeSingle()

    if (error) {
      logger.error(error)
      return NextResponse.json(
        { error: "Failed to fetch otc trade" },
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
    } satisfies GetOtcTradeResponse)
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
