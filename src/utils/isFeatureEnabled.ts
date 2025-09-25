/**
 * Deterministically check if a feature should be enabled for a user
 * based on their user ID and a fraction.
 * @param userId
 * @param fraction
 * @returns true if the feature should be enabled for the user, false otherwise
 */
export function isFeatureEnabled(userId: string, fraction: number) {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0 // 32-bit unsigned
  }
  const val = hash / 0xffffffff // normalize [0,1)
  return val < fraction
}
