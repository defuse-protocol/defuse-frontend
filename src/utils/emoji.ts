/**
 * A comprehensive list of safe, non-offensive emojis from various categories
 */
export const SAFE_EMOJIS: string[] = [
  // Smileys & People
  "😊",
  "😄",
  "😃",
  "🙂",
  "😉",
  "🥰",
  "😍",
  "🤩",
  "😎",
  "🥳",
  "🤗",
  "🤔",
  "😌",
  "😇",
  "👍",
  "👋",
  "🙌",
  "👏",
  "👧",
  "👦",

  // Nature
  "🌈",
  "🌞",
  "🌝",
  "🌚",
  "⭐",

  // Animals
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🐻",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
  "🐸",
  "🐵",
  "🙈",
  "🙉",
  "🙊",
  "🐔",
  "🐧",
  "🐦",
  "🦉",
  "🐺",
  "🦊",
  "🐗",
  "🐴",
  "🦄",
  "🐝",
  "🦋",
  "🐙",
  "🐬",
  "🐳",

  // Food & Drink
  "🍎",
  "🍐",
  "🍊",
  "🍋",
  "🍉",
  "🍇",
  "🍓",
  "🍒",
  "🍑",
  "🥭",
  "🍍",
  "🥥",
  "🥝",
  "🍅",
  "🥑",
  "🍔",
  "🍟",
  "🍕",

  // Activities & Sports
  "⚽",
  "🏀",
  "🏈",
  "⚾",
  "🥎",
  "🎾",
  "🏐",
  "🏉",
  "🎱",
  "🏓",
  "⛳",
  "🥊",
  "🤿",
  "🎽",
  "🛼",
  "🎿",
  "🏂",
  "🪂",
  "🏋",
  "🧘",
  "🎯",
  "🎮",
  "🎲",
  "🧩",
  "🎭",
  "🎨",
  "🎹",
  "🎸",
  "🥁",

  // Travel & Places
  "🚗",
  "🚕",
  "🚙",
  "🚌",
  "🚎",
  "🏎",
  "🚓",
  "🚑",
  "🚒",
  "🚐",
  "🛻",
  "🚚",
  "🚛",
  "🚜",
  "🛵",
  "🏡",
  "🗿",
]

/**
 * Interface for function options
 */
interface EmojiMapOptions {
  /** List of emojis to use (defaults to SAFE_EMOJIS) */
  emojiList?: string[]
  /** Number of emojis to return (defaults to 10) */
  count?: number
}

/**
 * Maps a string to a specified number of non-offensive emojis
 *
 * @param input - The input string to map
 * @param options - Optional configuration
 * @returns An array of emojis
 */
export function mapStringToEmojis(
  input: string,
  options: EmojiMapOptions = {}
): string[] {
  // Set default options
  const emojiList = options.emojiList || SAFE_EMOJIS
  const count = options.count || 10

  // Validate inputs
  if (count < 1) {
    throw new Error("Count must be a positive number")
  }

  if (emojiList.length === 0) {
    throw new Error("Emoji list cannot be empty")
  }

  // If input is empty, return first 'count' emojis
  if (!input || input.trim() === "") {
    return emojiList.slice(0, Math.min(count, emojiList.length))
  }

  // Calculate a hash value from the input string
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    // Use character code as part of the hash
    hash += input.charCodeAt(i)
  }

  // Select 'count' emojis based on the hash
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    // Use a different part of the hash for each emoji
    // The multiplier 7 helps distribute emojis more evenly
    const index = (hash + i * 7) % emojiList.length

    result.push(emojiList[index])
  }

  return result
}
