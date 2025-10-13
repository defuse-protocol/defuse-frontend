import { logger } from "@src/utils/logger"

export function formatGiftDate(dateString: number): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      minute: "2-digit",
      hour: "2-digit",
      hour12: false,
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString))
  } catch (error) {
    logger.error(
      new Error("Failed to format Gift updatedAt date", { cause: error })
    )
    return "-"
  }
}
