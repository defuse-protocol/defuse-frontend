import { db } from "@src/utils/drizzle"
import { and, eq } from "drizzle-orm"
import { type NewTag, type Tag, tagsTable } from "./schema"

/**
 * Create a new tag
 */
export async function createTag(tag: NewTag): Promise<Tag> {
  const [newTag] = await db.insert(tagsTable).values(tag).returning()
  return newTag
}

/**
 * Get a tag by auth_tag (@username)
 */
export async function getTagByAuthTag(authTag: string): Promise<Tag | null> {
  const [tag] = await db
    .select()
    .from(tagsTable)
    .where(eq(tagsTable.authTag, authTag))
    .limit(1)
  return tag ?? null
}

/**
 * Get tags by auth_identifier and auth_method
 */
export async function getTagsByIdentifierAndMethod(
  authIdentifier: string,
  authMethod: Tag["authMethod"]
): Promise<Tag[]> {
  return db
    .select()
    .from(tagsTable)
    .where(
      and(
        eq(tagsTable.authIdentifier, authIdentifier),
        eq(tagsTable.authMethod, authMethod)
      )
    )
}

/**
 * Update a tag by auth_tag
 */
export async function updateTag(
  authTag: string,
  updates: Partial<Pick<Tag, "authIdentifier" | "authMethod">>
): Promise<Tag | null> {
  const [updatedTag] = await db
    .update(tagsTable)
    .set(updates)
    .where(eq(tagsTable.authTag, authTag))
    .returning()
  return updatedTag ?? null
}
