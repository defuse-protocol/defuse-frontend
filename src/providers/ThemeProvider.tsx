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
}

export async function ThemeProvider({ children }: { children: ReactNode }) {
  const tpl = await whitelabelTemplateFlag()

  return (
    /*
      Added `forcedTheme` to prevent the dark theme from being applied.
      TODO: remove `forcedTheme` when dark mode will be enabled
    */
    <NextThemesThemeProvider attribute="class" forcedTheme="light">
      <Theme accentColor={accentsColors[tpl]}>{children}</Theme>
    </NextThemesThemeProvider>
  )
}
