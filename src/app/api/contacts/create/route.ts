import { contactsTable } from "@src/app/(app)/(auth)/contacts/_utils/schema"
import { db } from "@src/utils/drizzle"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"

const createContactSchema = z.object({
  // TODO: Later we might be able to get account_id from Bearer token
  account_id: z.string().min(1, "account_id is required"),
  address: z.string().min(1, "address is required"),
  name: z.string().min(1, "name is required"),
  network: z.string().min(1, "network is required"),
})

// TODO: This request should be authenticated same as in delete route.
//       Enable it once we have authentication system in place
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = createContactSchema.parse(body)

    const [newContact] = await db
      .insert(contactsTable)
      .values({
        account_id: validatedData.account_id,
        address: validatedData.address,
        name: validatedData.name,
        network: validatedData.network,
      })
      .returning()

    return NextResponse.json(
      {
        success: true,
        contactId: newContact.contactId,
        account_id: newContact.account_id,
        address: newContact.address,
        name: newContact.name,
        network: newContact.network,
        created_at: newContact.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    if ((error as { code?: string })?.code === "23505") {
      return NextResponse.json(
        { error: "Contact already exists" },
        { status: 409 }
      )
    }

    logger.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
