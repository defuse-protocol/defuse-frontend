import { unstable_flag as flag } from "@vercel/flags/next"

const validWhitelabelTemplates = [
  "near-intents",
  "solswap",
  "dogecoinswap",
  "turboswap",
] as const
export type WhitelabelTemplateValue = (typeof validWhitelabelTemplates)[number]

export const whitelabelTemplateFlag = flag({
  key: "whitelabelTemplate",
  defaultValue: "near-intents" as WhitelabelTemplateValue,
  options: [
    { label: "near-intents.org", value: "near-intents" },
    { label: "SolSwap.org", value: "solswap" },
    { label: "DogecoinSwap.org", value: "dogecoinswap" },
    { label: "TurboSwap.org", value: "turboswap" },
  ],
  decide(): WhitelabelTemplateValue {
    const val = process.env.FF_WHITELABEL_TEMPLATE

    if (
      val != null &&
      (validWhitelabelTemplates as readonly string[]).includes(val)
    ) {
      return val as WhitelabelTemplateValue
    }

    return "near-intents"
  },
})

export const enableDogecoin = flag({
  key: "dogecoin",
  description: "Enable Dogecoin support",
  options: [
    { label: "Off", value: false },
    { label: "On", value: true },
  ],
  decide: (): boolean => {
    return process.env.FF_DOGECOIN === "true"
  },
})
