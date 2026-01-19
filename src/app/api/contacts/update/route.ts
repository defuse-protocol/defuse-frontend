import { contactsTable } from "@src/app/(app)/(auth)/contacts/_utils/schema"
import { db } from "@src/utils/drizzle"
import { logger } from "@src/utils/logger"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateContactSchema = z.object({
  // TODO: Later we might be able to get account_id from Bearer token
  account_id: z.string().min(1, "account_id is required"),
  contactId: z.string().uuid("contactId must be a valid UUID"),
  address: z.string().min(1, "address is required"),
  name: z.string().min(1, "name is required"),
  network: z.string().min(1, "network is required"),
})

// TODO: This request should be authenticated same as in delete route.
//       Enable it once we have authentication system in place
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const validatedData = updateContactSchema.parse(body)

    // Check if contact exists and belongs to the account
    const [existingContact] = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.contactId, validatedData.contactId))
      .limit(1)

    if (!existingContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    if (existingContact.account_id !== validatedData.account_id) {
      return NextResponse.json(
        { error: "Unauthorized: Contact does not belong to this account" },
        { status: 403 }
      )
    }

    const [updatedContact] = await db
      .update(contactsTable)
      .set({
        address: validatedData.address,
        name: validatedData.name,
        network: validatedData.network,
      })
      .where(eq(contactsTable.contactId, validatedData.contactId))
      .returning()

    return NextResponse.json(
      {
        success: true,
        contactId: updatedContact.contactId,
        account_id: updatedContact.account_id,
        address: updatedContact.address,
        name: updatedContact.name,
        network: updatedContact.network,
        created_at: updatedContact.createdAt,
        updated_at: updatedContact.updatedAt,
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
