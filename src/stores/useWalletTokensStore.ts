import { validateTokenForWallet } from "@src/actions/auth"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export interface WalletToken {
  token: string
  expiresAt: number // Unix timestamp in ms
}

type State = {
  tokens: Record<string, WalletToken> // key: normalized wallet address
  _hasHydrated: boolean
}

type Actions = {
  getToken: (address: string) => string | null
  setToken: (address: string, token: string, expiresAt: number) => void
  removeToken: (address: string) => void
  isTokenValid: (address: string) => boolean
  validateToken: (
    address: string,
    chainType: string
  ) => Promise<{ valid: boolean; reason?: string }>
  clearExpiredTokens: () => void
  setHasHydrated: (value: boolean) => void
}

type Store = State & Actions

/**
 * Normalizes wallet address for consistent storage key
 * - EVM addresses: lowercase
 * - Other chains: preserve original case
 */
function normalizeAddress(address: string): string {
  // EVM addresses start with 0x and are 42 characters
  if (address.startsWith("0x") && address.length === 42) {
    return address.toLowerCase()
  }
  return address
}

export const useWalletTokensStore = create<Store>()(
  persist(
    (set, get) => ({
      tokens: {},
      _hasHydrated: false,

      getToken: (address: string): string | null => {
        const normalizedAddress = normalizeAddress(address)
        const tokenData = get().tokens[normalizedAddress]
        if (!tokenData) return null
        // Check if token is expired
        if (Date.now() >= tokenData.expiresAt) {
          return null
        }
        return tokenData.token
      },

      setToken: (address: string, token: string, expiresAt: number): void => {
        const normalizedAddress = normalizeAddress(address)
        set((state) => ({
          tokens: {
            ...state.tokens,
            [normalizedAddress]: { token, expiresAt },
          },
        }))
      },

      removeToken: (address: string): void => {
        const normalizedAddress = normalizeAddress(address)
        set((state) => {
          const { [normalizedAddress]: _, ...rest } = state.tokens
          return { tokens: rest }
        })
      },

      isTokenValid: (address: string): boolean => {
        const normalizedAddress = normalizeAddress(address)
        const tokenData = get().tokens[normalizedAddress]
        if (!tokenData) return false
        return Date.now() < tokenData.expiresAt
      },

      validateToken: async (
        address: string,
        chainType: string
      ): Promise<{ valid: boolean; reason?: string }> => {
        const normalizedAddress = normalizeAddress(address)
        const tokenData = get().tokens[normalizedAddress]

        if (!tokenData) {
          return { valid: false, reason: "no_token" }
        }

        // Client-side expiration check (fast path)
        if (Date.now() >= tokenData.expiresAt) {
          get().removeToken(address)
          return { valid: false, reason: "expired" }
        }

        // Server-side verification of signature + claims
        const result = await validateTokenForWallet(
          tokenData.token,
          address,
          chainType
        )

        if (!result.valid) {
          // Remove invalid token from store
          get().removeToken(address)
          return { valid: false, reason: result.reason }
        }

        return { valid: true }
      },

      clearExpiredTokens: (): void => {
        const now = Date.now()
        set((state) => {
          const validTokens: Record<string, WalletToken> = {}
          for (const [address, tokenData] of Object.entries(state.tokens)) {
            if (tokenData.expiresAt > now) {
              validTokens[address] = tokenData
            }
          }
          return { tokens: validTokens }
        })
      },

      setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),
    }),
    {
      name: "app_wallet_tokens",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => (_persistedState, error) => {
        if (!error) {
          state.setHasHydrated(true)
          // Clean up expired tokens on hydration
          state.clearExpiredTokens()
        }
      },
    }
  )
)
