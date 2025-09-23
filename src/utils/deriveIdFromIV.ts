import { v5 as uuidv5 } from "uuid"

export function deriveIdFromIV(iv: string): string {
  // This is the standard UUID namespace for URLs (RFC 4122)
  // It's used to generate deterministic UUIDs for gift IDs based on the IV
  const namespace = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
  return uuidv5(iv, namespace)
}
