import {
  type Tag,
  authMethodEnum,
  tagsTable,
} from "@src/app/(app)/(auth)/username/_utils/schema"
import { db } from "@src/utils/drizzle"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"

const createTagSchema = z.object({
  auth_tag: z
    .string()
    .refine((val) => val.match(/^@[a-zA-Z0-9_]{3,30}$/) !== null, {
      message:
        "Must be between 3 and 30 characters. Only letters, numbers, and underscores are allowed.",
    }),
  auth_identifier: z.string().min(1, "auth_identifier is required"),
  auth_method: z.enum(authMethodEnum, {
    errorMap: () => ({ message: "Invalid auth_method" }),
  }),
}) as z.ZodType<{
  auth_tag: string
  auth_identifier: string
  auth_method: Tag["authMethod"]
}>

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = createTagSchema.parse(body)

    const [newTag] = await db
      .insert(tagsTable)
      .values({
        authTag: validatedData.auth_tag,
        authIdentifier: validatedData.auth_identifier,
        authMethod: validatedData.auth_method,
      })
      .returning()

    return NextResponse.json(
      {
        success: true,
        auth_tag: newTag.authTag,
        auth_identifier: newTag.authIdentifier,
        auth_method: newTag.authMethod,
        created_at: newTag.createdAt,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    if ((error as { code?: string })?.code === "23505") {
      return NextResponse.json({ error: "Tag already exists" }, { status: 409 })
    }

    logger.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
