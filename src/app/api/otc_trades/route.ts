import { base64 } from "@scure/base"
import type {
  CreateOtcTradeResponse,
  ErrorResponse,
  OtcTrade,
} from "@src/features/otc/types/otcTypes"
import { supabase } from "@src/libs/supabase"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"

const otcTradesSchema: z.ZodType<Omit<OtcTrade, "pKey" | "tradeId">> = z.object(
  {
    encrypted_payload: z.string().refine((val) => {
      try {
        const decoded = base64.decode(val)
        // AES-GCM produces variable length output, but should be at least 16 bytes
        return decoded.length >= 16
      } catch (err) {
        return false
      }
    }, "Invalid encrypted_payload format"),
    iv: z.string().refine((val) => {
      try {
        const decoded = base64.decode(val)
        // IV should be exactly 12 bytes for AES-GCM
        return decoded.length === 12
      } catch (err) {
        return false
      }
    }, "Invalid IV format"),
  }
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = otcTradesSchema.parse(body)

    const { data, error } = await supabase
      .from("otc_trades")
      .upsert([
        {
          encrypted_payload: validatedData.encrypted_payload,
          iv: validatedData.iv,
        },
      ])
      .select("trade_id")
      .single()

    if (error) {
      logger.error(error)
      return NextResponse.json(
        {
          error: "Failed to create otc trade",
        } satisfies ErrorResponse,
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Failed to retrieve otc trade data" } satisfies ErrorResponse,
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        trade_id: data.trade_id,
      } satisfies CreateOtcTradeResponse,
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
