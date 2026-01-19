import { contactsTable } from "@src/app/(app)/(auth)/contacts/_utils/schema"
import { db } from "@src/utils/drizzle"
import { logger } from "@src/utils/logger"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

const querySchema = z.object({
  // TODO: Later we might be able to get account_id from Bearer token
  account_id: z.string().min(1, "account_id is required"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = querySchema.parse(body)

    const contacts = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.account_id, validatedData.account_id))

    return NextResponse.json(contacts)
  } catch (error) {
    logger.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
