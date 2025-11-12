import { Theme, type ThemeProps } from "@radix-ui/themes"
import { ThemeProvider as NextThemesThemeProvider } from "next-themes"
import type { ReactNode } from "react"

import {
  type WhitelabelTemplateValue,
  whitelabelTemplateFlag,
} from "@src/config/featureFlags"

const accentsColors: Record<
  WhitelabelTemplateValue,
  ThemeProps["accentColor"]
> = {
  "near-intents": "orange",
  solswap: "purple",
  dogecoinswap: "amber",
  turboswap: "amber",
  trumpswap: "tomato",
  rabitswap: "blue",
}

export async function ThemeProvider({ children }: { children: ReactNode }) {
  const tpl = (await whitelabelTemplateFlag()) as keyof typeof accentsColors
  const accentColor = accentsColors[tpl]

  return (
    <NextThemesThemeProvider
      attribute="class"
      forcedTheme={tpl === "rabitswap" ? "dark" : undefined}
    >
      <Theme accentColor={accentColor} hasBackground={false}>
        {children}
      </Theme>
    </NextThemesThemeProvider>
  )
}
