import { base58 } from "@scure/base"
import { NextResponse } from "next/server"
import { z } from "zod"

import type { GetCredentialResponse } from "@src/features/webauthn/types/webAuthnTypes"
import { supabase } from "@src/libs/supabase"
import { logger } from "@src/utils/logger"

const rawIdSchema = z.string().refine(
  (val) => {
    try {
      const decoded = base58.decode(val)
      return decoded.length <= 256
    } catch {
      return false
    }
  },
  { message: "Invalid raw_id format" }
)

export async function GET(
  request: Request,
  { params }: { params: { rawId: string } }
) {
  try {
    const rawId = rawIdSchema.parse(params.rawId)

    const { data, error } = await supabase
      .from("webauthn_credentials")
      .select("public_key")
      .eq("raw_id", rawId)
      .maybeSingle()

    if (error) {
      logger.error(error)
      return NextResponse.json(
        { error: "Failed to fetch credential" },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      public_key: data.public_key,
    } satisfies GetCredentialResponse)
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
