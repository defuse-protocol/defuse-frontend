import type { WhitelabelTemplateValue } from "@src/config/featureFlags"

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? ""

export const getDomainMetadataParams = (
  whitelabelTemplate: WhitelabelTemplateValue
) => {
  const params = {
    projectId: PROJECT_ID,
    metadata: {
      name: "NEAR Intents",
      description: "NEAR Intents",
      url: "https://near-intents.org/",
      icons: [
        "https://near-intents.org/favicons/near-intents/favicon-32x32.png",
      ],
    },
  }

  if (whitelabelTemplate === "solswap") {
    params.metadata.name = "Solswap"
    params.metadata.description = "Solswap"
    params.metadata.url = "https://solswap.org/"
    params.metadata.icons = [
      "https://solswap.org/favicons/solswap/favicon-32x32.png",
    ]
  }

  if (whitelabelTemplate === "turboswap") {
    params.metadata.name = "TurboSwap"
    params.metadata.description = "TurboSwap"
    params.metadata.url = "https://turboswap.org/"
    params.metadata.icons = [
      "https://turboswap.io/favicons/turboswap/favicon-32x32.png",
    ]
  }

  if (whitelabelTemplate === "dogecoinswap") {
    params.metadata.name = "DogecoinSwap"
    params.metadata.description = "DogecoinSwap"
    params.metadata.url = "https://dogecoinswap.org/"
    params.metadata.icons = [
      "https://dogecoinswap.org/favicons/dogecoinswap/favicon-32x32.png",
    ]
  }

  if (whitelabelTemplate === "trumpswap") {
    params.metadata.name = "TrumpSwap"
    params.metadata.description = "TrumpSwap"
    params.metadata.url = "https://trumpswap.org/"
    params.metadata.icons = [
      "https://trumpswap.org/favicons/trumpswap/favicon-32x32.png",
    ]
  }

  return params
}
