import { base58 } from "@scure/base"
import { NextResponse } from "next/server"
import { z } from "zod"

import type {
  CreateCredentialResponse,
  ErrorResponse,
  WebauthnCredential,
} from "@src/features/webauthn/types/webAuthnTypes"
import { supabase } from "@src/libs/supabase"
import { logger } from "@src/utils/logger"

const credentialSchema: z.ZodType<WebauthnCredential> = z.object({
  raw_id: z.string().refine(
    (val) => {
      try {
        const decoded = base58.decode(val)
        return decoded.length <= 256
      } catch {
        return false
      }
    },
    { message: "Invalid raw_id format" }
  ),
  public_key: z.string().refine(
    (val) => {
      try {
        const pk = val.split(":")[1] ?? ""
        const decoded = base58.decode(pk)
        return decoded.length === 32 || decoded.length === 64
      } catch {
        return false
      }
    },
    { message: "Invalid public_key format" }
  ),
  hostname: z.string().min(1).max(255),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = credentialSchema.parse(body)

    const { error } = await supabase.from("webauthn_credentials").insert([
      {
        raw_id: validatedData.raw_id,
        public_key: validatedData.public_key,
        hostname: validatedData.hostname,
      },
    ])

    if (error) {
      logger.error(error)
      return NextResponse.json(
        { error: "Failed to create credential" } satisfies ErrorResponse,
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true } satisfies CreateCredentialResponse,
      { status: 201 }
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
