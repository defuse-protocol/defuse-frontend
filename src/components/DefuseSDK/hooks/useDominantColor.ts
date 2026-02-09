import { useEffect, useState } from "react"

interface DominantColorResult {
  rgb: string | null
  hex: string | null
  loading: boolean
  error: Error | null
}

interface RGBColor {
  r: number
  g: number
  b: number
}

interface CachedColor {
  rgb: string
  hex: string
}

const colorCache = new Map<string, CachedColor>()
const pendingRequests = new Map<string, Promise<CachedColor>>()

/**
 * Extracts the dominant color from an image URL.
 * Proxies external images through Next.js image optimization to handle CORS.
 */
export function useDominantColor(
  imageUrl: string | null | undefined
): DominantColorResult {
  const [rgb, setRgb] = useState<string | null>(() =>
    imageUrl ? (colorCache.get(imageUrl)?.rgb ?? null) : null
  )
  const [hex, setHex] = useState<string | null>(() =>
    imageUrl ? (colorCache.get(imageUrl)?.hex ?? null) : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!imageUrl) {
      setRgb(null)
      setHex(null)
      setLoading(false)
      setError(null)
      return
    }

    const cached = colorCache.get(imageUrl)
    if (cached) {
      setRgb(cached.rgb)
      setHex(cached.hex)
      setLoading(false)
      setError(null)
      return
    }

    let isMounted = true

    async function extractColor() {
      if (!imageUrl) return

      setLoading(true)
      setError(null)

      try {
        let resultPromise = pendingRequests.get(imageUrl)

        if (!resultPromise) {
          resultPromise = extractColorFromUrl(imageUrl)
          pendingRequests.set(imageUrl, resultPromise)
        }

        const result = await resultPromise

        colorCache.set(imageUrl, result)
        pendingRequests.delete(imageUrl)

        if (isMounted) {
          setRgb(result.rgb)
          setHex(result.hex)
          setLoading(false)
        }
      } catch (err) {
        pendingRequests.delete(imageUrl)
        if (isMounted) {
          const error = err instanceof Error ? err : new Error("Unknown error")
          setError(error)
          setRgb(null)
          setHex(null)
          setLoading(false)
        }
      }
    }

    extractColor()

    return () => {
      isMounted = false
    }
  }, [imageUrl])

  return { rgb, hex, loading, error }
}

async function extractColorFromUrl(imageUrl: string): Promise<CachedColor> {
  const isAbsoluteUrl =
    imageUrl.startsWith("http://") || imageUrl.startsWith("https://")

  let isSameOrigin = false
  if (isAbsoluteUrl && typeof window !== "undefined") {
    try {
      isSameOrigin = new URL(imageUrl).origin === window.location.origin
    } catch {
      isSameOrigin = false
    }
  }

  const needsProxy = isAbsoluteUrl && !isSameOrigin
  const imgSrc = needsProxy
    ? `/_next/image?url=${encodeURIComponent(imageUrl)}&w=64&q=75`
    : imageUrl

  const img = new Image()
  if (needsProxy) {
    img.crossOrigin = "anonymous"
  }

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`))
    img.src = imgSrc
  })

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d", { willReadFrequently: true })

  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  const sampleSize = 32
  canvas.width = sampleSize
  canvas.height = sampleSize
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize)

  try {
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
    const dominantColor = getDominantColor(imageData.data)

    return {
      rgb: `rgb(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b})`,
      hex: rgbToHex(dominantColor),
    }
  } catch {
    throw new Error(`Cannot read image data: ${imageUrl}`)
  }
}

function getDominantColor(pixels: Uint8ClampedArray): RGBColor {
  const colorCounts = new Map<string, { count: number; color: RGBColor }>()

  // Sample every 4th pixel for performance
  for (let i = 0; i < pixels.length; i += 16) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]

    // Skip transparent pixels
    if (a < 128) continue

    // Skip near-white pixels based on brightness
    const brightness = (r + g + b) / 3
    if (brightness > 230) continue

    // Skip near-black pixels
    if (brightness < 25) continue

    // Skip near-gray pixels with very low saturation
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const saturation = max === 0 ? 0 : (max - min) / max
    if (saturation < 0.1) continue

    // Quantize colors to reduce unique values
    // Clamp to 255 to avoid invalid RGB values
    const qr = Math.min(255, Math.round(r / 32) * 32)
    const qg = Math.min(255, Math.round(g / 32) * 32)
    const qb = Math.min(255, Math.round(b / 32) * 32)

    const key = `${qr},${qg},${qb}`
    const existing = colorCounts.get(key)

    if (existing) {
      existing.count++
    } else {
      colorCounts.set(key, { count: 1, color: { r: qr, g: qg, b: qb } })
    }
  }

  // If no colorful pixels found, return neutral gray
  if (colorCounts.size === 0) {
    return { r: 128, g: 128, b: 128 }
  }

  // Find the most common color
  let dominant: RGBColor = { r: 128, g: 128, b: 128 }
  let maxCount = 0

  for (const { count, color } of colorCounts.values()) {
    // Weight by saturation to prefer more vibrant colors
    const saturation = getSaturation(color)
    const weightedCount = count * (1 + saturation * 0.5)

    if (weightedCount > maxCount) {
      maxCount = weightedCount
      dominant = color
    }
  }

  return dominant
}

function getSaturation(color: RGBColor): number {
  const max = Math.max(color.r, color.g, color.b)
  const min = Math.min(color.r, color.g, color.b)

  if (max === 0) return 0
  return (max - min) / max
}

function rgbToHex(color: RGBColor): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0")
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`
}

export function hexToRgba(hex: string | null, opacity: number): string | null {
  if (!hex) return null

  const cleanHex = hex.replace("#", "")

  const r = Number.parseInt(cleanHex.slice(0, 2), 16)
  const g = Number.parseInt(cleanHex.slice(2, 4), 16)
  const b = Number.parseInt(cleanHex.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
