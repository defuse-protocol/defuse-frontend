import type { SystemStatusType } from "@src/providers/SystemStatusProvider"
import { logger } from "@src/utils/logger"
import { unstable_cache } from "next/cache"
import z from "zod"

const getSystemStatusesSchema = z.object({
  posts: z.array(
    z.object({
      id: z.string(),
      starts_at: z.number().nullable(),
      post_type: z.literal("maintenance").or(z.literal("incident")),
      title: z.string(),
      ends_at: z.number().nullable(),
    })
  ),
})

type SystemStatusResponse = z.infer<typeof getSystemStatusesSchema>

async function fetchSystemStatus(): Promise<SystemStatusResponse> {
  try {
    const response = await fetch(
      "https://status.near-intents.org/api/posts?is_featured=true",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch system statuses")
    }
    const parsedData = getSystemStatusesSchema.parse(await response.json())
    return parsedData
  } catch (error: unknown) {
    let errorMessage = "System statuses not fetched"
    if (error instanceof z.ZodError) {
      errorMessage = "Invalid system statuses schema"
    }

    logger.error(errorMessage, { error })
    throw error
  }
}

export const getCachedSystemStatus = unstable_cache(
  async (): Promise<SystemStatusType | null> => {
    try {
      const systemStatusData = await fetchSystemStatus()
      const now = Date.now()

      const systemStatus: SystemStatusType = systemStatusData.posts.reduce(
        (acc: SystemStatusType, post) => {
          // maintenance
          if (
            post.post_type === "maintenance" &&
            post.starts_at !== null &&
            post.ends_at !== null &&
            now >= post.starts_at &&
            now <= post.ends_at
          ) {
            acc.push({
              id: post.id,
              status: "maintenance",
              message:
                "We’re performing scheduled maintenance. Deposits and withdrawals may be temporarily unavailable.",
            })
          }

          // incident
          if (post.post_type === "incident") {
            acc.push({
              id: post.id,
              status: "incident",
              message:
                post.title ??
                "We’re experiencing service disruption affecting deposits and withdrawals. Our team is actively working on a resolution.",
            })
          }
          return acc
        },
        []
      )

      return systemStatus
    } catch {
      return null
    }
  },
  ["system-status"],
  {
    revalidate: 60, // 1 minute
    tags: ["system-status"],
  }
)
