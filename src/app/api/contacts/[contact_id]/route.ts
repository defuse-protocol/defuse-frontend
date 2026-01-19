import { contactsTable } from "@src/app/(app)/(auth)/contacts/_utils/schema"
import { db } from "@src/utils/drizzle"
import { getAccountIdFromToken } from "@src/utils/dummyAuth"
import { logger } from "@src/utils/logger"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

const contactIdSchema = z.string().uuid("contact_id must be a valid UUID")

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contact_id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required: Bearer token missing" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    const account_id = await getAccountIdFromToken(token)
    if (!account_id) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      )
    }

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

    if (contact.account_id !== account_id) {
      return NextResponse.json(
        { error: "Unauthorized: Contact does not belong to this account" },
        { status: 403 }
      )
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
