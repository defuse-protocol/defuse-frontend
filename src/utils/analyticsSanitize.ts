/**
 * Hashes a wallet address (or any PII string) before sending to analytics,
 * so raw addresses are never stored in third-party services like Mixpanel.
 *
 * Never throws — returns "unknown" if hashing fails (e.g. non-secure context).
 */
export async function hashForAnalytics(
  value: string | undefined
): Promise<string> {
  if (!value) return "no_address"

  try {
    const encoded = new TextEncoder().encode(value)
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      encoded as BufferSource
    )
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  } catch {
    return "hash_unavailable"
  }
}
