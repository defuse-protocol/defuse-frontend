type ContactColors = {
  background: string
  icon: string
}

export function stringToColor(str: string): ContactColors {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const unsigned = hash >>> 0
  const hue = Math.round((unsigned * 137.508) % 360)

  return {
    background: `oklch(95% 0.05 ${hue})`,
    icon: `oklch(65% 0.22 ${hue})`,
  }
}
