import { mapStringToEmojis } from "@src/utils/emoji"
import { describe, expect, it } from "vitest"

describe("mapStringToEmoji", () => {
  it("generates emojis deterministically", () => {
    const list = ["🍕", "🌮", "🍔", "🥗", "🍣", "🍜", "🍩", "🍦", "🍰", "🍫"]

    const result1 = mapStringToEmojis("Hello World", {
      emojiList: list,
      count: 3,
    })

    const result2 = mapStringToEmojis("Hello World", {
      emojiList: list,
      count: 3,
    })

    expect(result1).toEqual(["🍔", "🍫", "🍩"])
    expect(result2).toEqual(result1)
  })
})
