import { tagsTable } from "@src/app/(app)/(auth)/username/_utils/schema"
import { db } from "@src/utils/drizzle"
import { logger } from "@src/utils/logger"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

const tagSchema = z
  .string()
  .refine((val) => val.match(/^@[a-zA-Z0-9_]{3,30}$/) !== null, {
    message:
      "Must be between 3 and 30 characters. Only letters, numbers, and underscores are allowed.",
  })

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tag: string }> }
) {
  try {
    const { tag } = await params
    const validatedTag = tagSchema.parse(tag)

    const [tagData] = await db
      .select({
        auth_identifier: tagsTable.authIdentifier,
        auth_method: tagsTable.authMethod,
      })
      .from(tagsTable)
      .where(eq(tagsTable.authTag, validatedTag))
      .limit(1)

    if (!tagData) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    return NextResponse.json({
      auth_identifier: tagData.auth_identifier,
      auth_method: tagData.auth_method,
    })
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
