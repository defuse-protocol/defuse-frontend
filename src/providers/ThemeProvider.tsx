import { Theme, type ThemeProps } from "@radix-ui/themes"
import { ThemeProvider as NextThemesThemeProvider } from "next-themes"
import type { ReactNode } from "react"

import {
  type WhitelabelTemplateValue,
  whitelabelTemplateFlag,
} from "@src/config/featureFlags"
import { RadixThemeSync } from "./RadixThemeSync"

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
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      forcedTheme={tpl === "rabitswap" ? "dark" : undefined}
    >
      <Theme accentColor={accentColor} hasBackground={false}>
        <RadixThemeSync />
        {children}
      </Theme>
    </NextThemesThemeProvider>
  )
}
