import { getTokenId } from "@src/components/DefuseSDK/utils/token"
import type { TokenWithTags } from "@src/constants/tokens"
import { createStore } from "zustand/vanilla"

export type TokensState = {
  tokens: TokenWithTags[]
}

export type TokensActions = {
  updateTokens: (tokens: TokenWithTags[]) => void
}

export type TokensStore = TokensState & TokensActions

export const initTokensStore = (): TokensState => {
  return { tokens: [] }
}

export const defaultInitState: TokensState = { tokens: [] }

export const createTokensStore = (
  initState: TokensState = defaultInitState
) => {
  return createStore<TokensStore>()((set) => ({
    ...initState,
    updateTokens: (tokens: TokenWithTags[]) =>
      set(() => {
        const updatedTokens = new Map<string, TokenWithTags>()
        for (const item of tokens) {
          const tokenId = getTokenId(item)

          // Unified tokens may contain multiple tokens with the same defuseAssetId,
          // we take only the first one.
          if (!updatedTokens.has(tokenId)) {
            updatedTokens.set(tokenId, item)
          }
        }
        return { tokens: [...updatedTokens.values()] }
      }),
  }))
}
