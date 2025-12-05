"use client"

import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth"
import {
  WagmiProvider as PrivyWagmiProvider,
  useSetActiveWallet,
} from "@privy-io/wagmi"
import { config } from "@src/config/wagmi"
import queryClient from "@src/constants/queryClient"
import { PRIVY_APP_ID } from "@src/utils/environment"
import { logger } from "@src/utils/logger"
import { QueryClientProvider } from "@tanstack/react-query"
import {
  type FC,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react"
import { WagmiProvider } from "wagmi"

interface PrivyWalletContextValue {
  /** Whether the user is authenticated with Privy */
  authenticated: boolean
  /** Whether authentication is in progress */
  isLoading: boolean
  /** Open the Privy login modal */
  login: () => void
  /** Log out from Privy */
  logout: () => Promise<void>
}

const PrivyWalletContext = createContext<PrivyWalletContextValue | null>(null)

/**
 * Inner component that uses Privy hooks to sync wallet state.
 * This must be rendered inside both PrivyProvider and WagmiProvider.
 */
function PrivyWalletSync({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useWallets()
  const { setActiveWallet } = useSetActiveWallet()

  // Track previous auth state to detect login (false -> true transition)
  // Start as false so initial mount with authenticated=true triggers sync
  const wasAuthenticatedRef = useRef(false)
  // Track if user has explicitly logged out this session
  const hasLoggedOutRef = useRef(false)

  // Find the embedded wallet
  const embeddedWallet = useMemo(() => {
    return wallets.find((wallet) => wallet.walletClientType === "privy")
  }, [wallets])

  // Only sync wallet when user logs IN (not after logout)
  useEffect(() => {
    const wasAuthenticated = wasAuthenticatedRef.current
    wasAuthenticatedRef.current = authenticated

    // Don't reconnect if user has logged out this session
    if (hasLoggedOutRef.current) {
      return
    }

    // Only activate wallet on login transition (false -> true)
    if (!wasAuthenticated && authenticated && embeddedWallet) {
      setActiveWallet(embeddedWallet)
    }
  }, [authenticated, embeddedWallet, setActiveWallet])

  const handleLogout = useCallback(async () => {
    // Mark as logged out to prevent any future auto-reconnect this session
    hasLoggedOutRef.current = true
    try {
      // Logout from Privy - wagmi disconnect is handled by useConnectWallet
      await logout()
    } catch (error) {
      logger.error("Privy logout error:")
      if (error instanceof Error) {
        logger.error(error.message)
      }
      throw error
    }
  }, [logout])

  const value: PrivyWalletContextValue = useMemo(
    () => ({
      authenticated,
      isLoading: !ready,
      login,
      logout: handleLogout,
    }),
    [authenticated, ready, login, handleLogout]
  )

  return (
    <PrivyWalletContext.Provider value={value}>
      {children}
    </PrivyWalletContext.Provider>
  )
}

/**
 * Wagmi wrapper that uses Privy's WagmiProvider when Privy is configured,
 * or standard WagmiProvider otherwise.
 * Also includes QueryClientProvider in both cases.
 */
export const PrivyWagmiWrapper: FC<{ children: ReactNode }> = ({
  children,
}) => {
  // If no Privy App ID is configured, use standard WagmiProvider with QueryClientProvider
  if (!PRIVY_APP_ID) {
    return (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    )
  }

  // When Privy is enabled, use PrivyProvider with Privy's WagmiProvider
  // QueryClientProvider is included here because Privy's wagmi adapter needs it
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Configure login methods
        loginMethods: ["email", "google", "twitter", "discord", "github"],
        // Appearance settings
        appearance: {
          theme: "dark",
          accentColor: "#00EC97",
          logo: "/static/logos/near-intents.svg",
          showWalletLoginFirst: false,
        },
        // Embedded wallet configuration
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
          showWalletUIs: false,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PrivyWagmiProvider config={config}>{children}</PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}

/**
 * Privy wallet context provider that provides login/logout functionality.
 * Should be rendered inside PrivyWagmiWrapper.
 */
export const PrivyWalletProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  // If no Privy App ID is configured, just render children
  if (!PRIVY_APP_ID) {
    return <>{children}</>
  }

  return <PrivyWalletSync>{children}</PrivyWalletSync>
}

export function usePrivyWallet(): PrivyWalletContextValue {
  const context = useContext(PrivyWalletContext)

  // Return a no-op implementation if Privy is not configured
  if (!context) {
    return {
      authenticated: false,
      isLoading: false,
      login: () => {
        logger.warn("Privy is not configured. Set NEXT_PUBLIC_PRIVY_APP_ID.")
      },
      logout: async () => {},
    }
  }

  return context
}
