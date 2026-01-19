import { contactsTable } from "@src/app/(app)/(auth)/contacts/_utils/schema"
import { db } from "@src/utils/drizzle"
import { getAccountIdFromToken } from "@src/utils/dummyAuth"
import { logger } from "@src/utils/logger"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

const deleteContactSchema = z.object({
  contactId: z.string().uuid("contactId must be a valid UUID"),
})

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required: Bearer token missing" },
        { status: 401 }
      )
    }

    // Remove "Bearer " prefix
    const token = authHeader.substring(7)

    const account_id = await getAccountIdFromToken(token)
    if (!account_id) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = deleteContactSchema.parse(body)

    const [existingContact] = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.contactId, validatedData.contactId))
      .limit(1)

    if (!existingContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    if (existingContact.account_id !== account_id) {
      return NextResponse.json(
        { error: "Unauthorized: Contact does not belong to this account" },
        { status: 403 }
      )
    }

    await db
      .delete(contactsTable)
      .where(eq(contactsTable.contactId, validatedData.contactId))

    return NextResponse.json(
      {
        success: true,
        message: "Contact deleted successfully",
        contactId: validatedData.contactId,
      },
      { status: 200 }
    )
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
