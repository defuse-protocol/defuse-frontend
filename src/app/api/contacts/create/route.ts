import { contactsTable } from "@src/app/(app)/(auth)/contacts/_utils/schema"
import { db } from "@src/utils/drizzle"
import { getAccountIdFromToken } from "@src/utils/dummyAuth"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"

const createContactSchema = z.object({
  address: z.string().min(1, "address is required"),
  name: z.string().min(1, "name is required"),
  network: z.string().min(1, "network is required"),
})

export async function POST(request: Request) {
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

    const body = await request.json()
    const validatedData = createContactSchema.parse(body)

    const [newContact] = await db
      .insert(contactsTable)
      .values({
        account_id,
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
