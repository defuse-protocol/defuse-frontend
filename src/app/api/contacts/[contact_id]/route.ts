import { contactsTable } from "@src/app/(app)/(auth)/contacts/_utils/schema"
import { db } from "@src/utils/drizzle"
import { logger } from "@src/utils/logger"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

const contactIdSchema = z.string().uuid("contact_id must be a valid UUID")

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contact_id: string }> }
) {
  try {
    const { contact_id } = await params
    const validatedContactId = contactIdSchema.parse(contact_id)

    const [contact] = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.contactId, validatedContactId))
      .limit(1)

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    return NextResponse.json(contact)
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
