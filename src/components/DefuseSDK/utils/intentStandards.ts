import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { IntentStandardEnum } from "@defuse-protocol/one-click-sdk-typescript"

/**
 * Maps AuthMethod to IntentStandardEnum for use with /generate-intent API
 */
export const AUTH_METHOD_TO_STANDARD: Record<AuthMethod, IntentStandardEnum> = {
  evm: IntentStandardEnum.ERC191,
  near: IntentStandardEnum.NEP413,
  solana: IntentStandardEnum.RAW_ED25519,
  webauthn: IntentStandardEnum.WEBAUTHN,
  ton: IntentStandardEnum.TON_CONNECT,
  tron: IntentStandardEnum.TIP191,
  stellar: IntentStandardEnum.SEP53,
}
