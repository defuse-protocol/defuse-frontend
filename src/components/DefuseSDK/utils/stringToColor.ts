type ContactColors = {
  background: string
  icon: string
}

const GOLDEN_RATIO_CONJUGATE = 0.618033988749895

export function stringToColor(str: string): ContactColors {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  const index = (hash >>> 0) % 360
  const hue = Math.round(((index * GOLDEN_RATIO_CONJUGATE) % 1) * 360)

  return {
    background: `oklch(95% 0.05 ${hue})`,
    icon: `oklch(65% 0.22 ${hue})`,
  }
}
