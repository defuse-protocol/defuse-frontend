import { unstable_flag as flag } from "@vercel/flags/next"

export const enableDogecoin = flag({
  key: "dogecoin",
  description: "Enable Dogecoin support",
  options: [
    { label: "Off", value: false },
    { label: "On", value: true },
  ],
  decide: (): boolean => {
    return false
  },
})
