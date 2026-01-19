import { generateAppAuthToken } from "@src/utils/jwt"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"

const generateTokenSchema = z.object({
  authIdentifier: z.string().min(1, "authIdentifier is required"),
  authMethod: z.string().min(1, "authMethod is required"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = generateTokenSchema.parse(body)

    const token = await generateAppAuthToken(
      validatedData.authIdentifier,
      validatedData.authMethod
    )

    return NextResponse.json({ token }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    logger.error("Failed to generate app auth token", { error })
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    )
  }
}
