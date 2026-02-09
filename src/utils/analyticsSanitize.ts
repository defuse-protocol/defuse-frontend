/**
 * Hashes a wallet address (or any PII string) before sending to analytics,
 * so raw addresses are never stored in third-party services like Mixpanel.
 */
export async function hashForAnalytics(
  value: string | undefined
): Promise<string | undefined> {
  if (!value) return undefined

  const encoded = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoded as BufferSource
  )
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
