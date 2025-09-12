import { getTokenId } from "@src/components/DefuseSDK/utils/token"
import { createStore } from "zustand/vanilla"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../types/base"

export type TokensState = {
  data: Map<string, BaseTokenInfo | UnifiedTokenInfo>
  isLoading: boolean
  isFetched: boolean
}

export type TokensActions = {
  onLoad: () => void
  updateTokens: (
    data: (BaseTokenInfo | UnifiedTokenInfo)[],
    is1cs?: boolean
  ) => void
}

export type TokensStore = TokensState & TokensActions

export const initTokensStore = (): TokensState => {
  return {
    data: new Map(),
    isLoading: false,
    isFetched: false,
  }
}

export const defaultInitState: TokensState = {
  data: new Map(),
  isLoading: false,
  isFetched: false,
}

export const createTokensStore = (
  initState: TokensState = defaultInitState
) => {
  return createStore<TokensStore>()((set) => ({
    ...initState,
    onLoad: () => set({ isLoading: true }),
    updateTokens: (data: (BaseTokenInfo | UnifiedTokenInfo)[], is1cs = false) =>
      set((state) => {
        const updatedData = is1cs ? new Map() : new Map(state.data)
        for (const item of data) {
          const tokenId = getTokenId(item)

          // Unified tokens may contain multiple tokens with the same defuseAssetId,
          // we take only the first one.
          if (!updatedData.has(tokenId)) {
            updatedData.set(tokenId, item)
          }
        }
        return { data: updatedData, isFetched: true, isLoading: false }
      }),
  }))
}
