import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { flattenTokenList } from "@src/components/DefuseSDK/utils/token"
import { extractTokenFamilyList } from "@src/components/DefuseSDK/utils/tokenFamily"
import PRODUCTION_TOKENS from "@src/tokens/production.json" with {
  type: "json",
}
import STAGE_TOKENS from "@src/tokens/stage.json" with { type: "json" }
import { INTENTS_ENV } from "@src/utils/environment"

export const LIST_TOKENS: TokenInfo[] = (
  INTENTS_ENV === "production" ? PRODUCTION_TOKENS.tokens : STAGE_TOKENS.tokens
) as TokenInfo[]

export const DEPRECATED_TOKENS: Record<string, boolean> = {
  "nep141:aurora": true,
}

export const LIST_TOKENS_FLATTEN = flattenTokenList(LIST_TOKENS)
export const tokenFamilies = extractTokenFamilyList(LIST_TOKENS)
