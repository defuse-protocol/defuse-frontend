"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

/**
 * Syncs next-themes resolved theme with Radix UI Theme's appearance.
 * Radix reads `data-*` attributes or `.dark` class on the root element;
 * since next-themes already sets the `class` attribute, Radix picks it up.
 * This component additionally sets `color-scheme` for native elements.
 */
export function RadixThemeSync() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    document.documentElement.style.colorScheme =
      resolvedTheme === "dark" ? "dark" : "light"
  }, [resolvedTheme])

  return null
}
