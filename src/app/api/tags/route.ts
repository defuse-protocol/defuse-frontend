import {
  authMethodEnum,
  tagsTable,
} from "@src/app/(app)/(auth)/username/_utils/schema"
import { db } from "@src/utils/drizzle"
import { logger } from "@src/utils/logger"
import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

const querySchema = z.object({
  auth_identifier: z.string().min(1, "auth_identifier is required"),
  auth_method: z.enum(authMethodEnum, {
    errorMap: () => ({ message: "Invalid auth_method" }),
  }),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = querySchema.parse(body)

    const tags = await db
      .select({
        auth_tag: tagsTable.authTag,
      })
      .from(tagsTable)
      .where(
        and(
          eq(tagsTable.authIdentifier, validatedData.auth_identifier),
          eq(tagsTable.authMethod, validatedData.auth_method)
        )
      )

    return NextResponse.json({
      tags: tags.map((tag) => tag.auth_tag),
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
