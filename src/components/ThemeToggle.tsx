"use client"

import { Moon, Sun } from "@phosphor-icons/react"
import { cn } from "@src/utils/cn"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-9 rounded-xl bg-sidebar-hover/50" />
  }

  const isLight = resolvedTheme === "light"

  return (
    <div className="flex h-9 rounded-xl bg-gray-900 p-1">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors",
          isLight
            ? "bg-gray-700 text-white"
            : "text-gray-400 hover:text-gray-300"
        )}
      >
        <Sun weight="bold" className="size-3.5" />
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors",
          !isLight
            ? "bg-gray-700 text-white"
            : "text-gray-400 hover:text-gray-300"
        )}
      >
        <Moon weight="bold" className="size-3.5" />
        Dark
      </button>
    </div>
  )
}
