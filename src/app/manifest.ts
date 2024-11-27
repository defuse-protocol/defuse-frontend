import { whitelabelTemplateFlag } from "@src/config/featureFlags"
import { unstable_evaluate as evaluate } from "@vercel/flags/next"
import type { MetadataRoute } from "next"
import icon192 from "./android-chrome-192x192.png"
import icon512 from "./android-chrome-512x512.png"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [whitelabelTpl] = await evaluate([whitelabelTemplateFlag])

  const manifest: MetadataRoute.Manifest = {
    name: "NEAR Intents",
    short_name: "NEAR Intents",
    icons: [
      {
        src: icon192.src,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: icon512.src,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
  }

  switch (whitelabelTpl) {
    case "near-intents":
      break
    case "solswap":
      manifest.name = "Solswap"
      manifest.short_name = "Solswap"
      break
    case "dogecoinswap":
      manifest.name = "DogecoinSwap"
      manifest.short_name = "DogecoinSwap"
      break
    case "turboswap":
      manifest.name = "TurboSwap"
      manifest.short_name = "TurboSwap"
      break
    default:
      whitelabelTpl satisfies never
      console.warn(`Unknown whitelabel template: ${whitelabelTpl}`)
  }

  return manifest
}
