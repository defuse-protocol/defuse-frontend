import { base64 } from "@scure/base"
import { base64urlnopad } from "@scure/base"
import type {
  CreateOtcTradeRequest,
  CreateOtcTradeResponse,
  ErrorResponse,
} from "@src/features/otc/types/otcTypes"
import { supabase } from "@src/libs/supabase"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"

const otcTradesSchema = z
  .object({
    encrypted_payload: z.string().refine((val) => {
      try {
        const decoded = base64.decode(val)
        // AES-GCM produces variable length output, but should be at least 16 bytes
        return decoded.length >= 16
      } catch (err) {
        return false
      }
    }, "Invalid encrypted_payload format"),
  })
  .and(
    z.union([
      z.object({
        iv: z.string().refine((val) => {
          try {
            const decoded = base64.decode(val)
            // IV should be exactly 12 bytes for AES-GCM
            return decoded.length === 12
          } catch (err) {
            return false
          }
        }, "Invalid IV format"),
        p_key: z.never().optional(),
      }),
      z.object({
        p_key: z.string().refine((val) => {
          try {
            const keyBytes = base64urlnopad.decode(val)
            return keyBytes.length === 32
          } catch {
            return false
          }
        }, "Key must be exactly 32 bytes (AES-256)"),
        iv: z.never().optional(),
      }),
    ])
  ) as z.ZodType<CreateOtcTradeRequest>

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = otcTradesSchema.parse(body)

    const { error } = await supabase.from("otc_trades").insert([
      {
        encrypted_payload: validatedData.encrypted_payload,
        ...("iv" in validatedData
          ? { iv: validatedData.iv }
          : { p_key: validatedData.p_key }),
      },
    ])

    if (error) {
      logger.error(error)
      return NextResponse.json(
        {
          error: "Failed to create otc trade",
        } satisfies ErrorResponse,
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
      } satisfies CreateOtcTradeResponse,
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
