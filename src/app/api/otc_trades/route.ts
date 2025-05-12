import type {
  CreateOtcTradeResponse,
  ErrorResponse,
  OtcTrade,
} from "@src/features/otc/types/otcTypes"
import { supabase } from "@src/libs/supabase"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"
import { rawIdSchema } from "./_utils/validation"

const otcTradesSchema: z.ZodType<OtcTrade> = z.object({
  raw_id: rawIdSchema,
  encrypted_payload: z.string(),
  hostname: z.string().min(1).max(255),
})

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const validatedData = otcTradesSchema.parse(body)

    const { error } = await supabase.from("otc_trades").upsert([
      {
        raw_id: validatedData.raw_id,
        encrypted_payload: validatedData.encrypted_payload,
        hostname: validatedData.hostname,
      },
    ])

    if (error) {
      logger.error(error)
      return NextResponse.json(
        {
          error: "Failed to create or update otc trade",
        } satisfies ErrorResponse,
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true } satisfies CreateOtcTradeResponse,
      {
        status: 200,
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
