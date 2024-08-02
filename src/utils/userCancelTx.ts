export default function userCancelTx(e: unknown): boolean {
  try {
    if (typeof e !== "string") return false
    return e.includes("cancel") || e.includes("reject") || e.includes("denied")
  } catch {
    return false
  }
}
