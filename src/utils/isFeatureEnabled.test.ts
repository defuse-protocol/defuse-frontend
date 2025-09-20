import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import { isFeatureEnabled } from "./isFeatureEnabled"

describe("isFeatureEnabled", () => {
  it("should return true when fraction is 1 (100%)", () => {
    expect(isFeatureEnabled("user1", 1)).toBe(true)
    expect(isFeatureEnabled("user2", 1)).toBe(true)
    expect(isFeatureEnabled("differentUser", 1)).toBe(true)
  })

  it("should return false when fraction is 0 (0%)", () => {
    expect(isFeatureEnabled("user1", 0)).toBe(false)
    expect(isFeatureEnabled("user2", 0)).toBe(false)
    expect(isFeatureEnabled("differentUser", 0)).toBe(false)
  })

  it("should be deterministic for the same user ID", () => {
    const userId = "testUser123"
    const fraction = 0.5

    const result1 = isFeatureEnabled(userId, fraction)
    const result2 = isFeatureEnabled(userId, fraction)
    const result3 = isFeatureEnabled(userId, fraction)

    expect(result1).toBe(result2)
    expect(result2).toBe(result3)
  })

  it("should handle edge case fractions correctly", () => {
    const userId = "testUser"

    // Very small fraction - should be false for most users
    expect(isFeatureEnabled(userId, 0.001)).toBe(false)

    // Very large fraction - should be true for most users
    expect(isFeatureEnabled(userId, 0.999)).toBe(true)
  })

  it("should handle empty user ID", () => {
    // Empty string should still work (hash will be 0)
    expect(() => isFeatureEnabled("", 0.5)).not.toThrow()
    expect(isFeatureEnabled("", 0)).toBe(false)
    expect(isFeatureEnabled("", 1)).toBe(true)
  })

  it("should handle special characters in user ID", () => {
    const specialUserIds = [
      "user@example.com",
      "user-123_456",
      "用户123", // Unicode characters
      "user!@#$%^&*()",
    ]

    for (const userId of specialUserIds) {
      expect(() => isFeatureEnabled(userId, 0.5)).not.toThrow()
      // Result should be deterministic
      const result1 = isFeatureEnabled(userId, 0.5)
      const result2 = isFeatureEnabled(userId, 0.5)
      expect(result1).toBe(result2)
    }
  })

  it("should distribute users roughly according to fraction", () => {
    const fraction = 0.3 // 30%
    const numTests = 1000
    let enabledCount = 0

    // Generate many user IDs and count how many get enabled
    for (let i = 0; i < numTests; i++) {
      const userId = randomUUID()
      if (isFeatureEnabled(userId, fraction)) {
        enabledCount++
      }
    }

    const actualFraction = enabledCount / numTests

    // Should be roughly 30% with some tolerance for randomness
    expect(actualFraction).toBeGreaterThan(0.25)
    expect(actualFraction).toBeLessThan(0.35)
  })

  it("should handle long user IDs", () => {
    const longUserId = "a".repeat(1000)

    expect(() => isFeatureEnabled(longUserId, 0.5)).not.toThrow()

    // Should be deterministic even with long IDs
    const result1 = isFeatureEnabled(longUserId, 0.5)
    const result2 = isFeatureEnabled(longUserId, 0.5)
    expect(result1).toBe(result2)
  })

  it("should return boolean values only", () => {
    const result1 = isFeatureEnabled("user1", 0.3)
    const result2 = isFeatureEnabled("user2", 0.7)

    expect(typeof result1).toBe("boolean")
    expect(typeof result2).toBe("boolean")
  })

  it("should handle fraction boundaries correctly", () => {
    const userId = "boundaryTestUser"

    // Test exact boundary conditions
    expect(isFeatureEnabled(userId, 0)).toBe(false)
    expect(isFeatureEnabled(userId, 1)).toBe(true)

    // The normalized hash value should be < fraction for true
    // Let's test a user where we know the approximate hash value
    const result = isFeatureEnabled(userId, 0.5)
    expect(typeof result).toBe("boolean")
  })
})
