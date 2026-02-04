import { getCachedSystemStatus } from "@src/actions/systemStatus"
import { InitDefuseSDK } from "@src/components/InitDefuseSDK"
import { PreloadFeatureFlags } from "@src/components/PreloadFeatureFlags"
import { SentryTracer } from "@src/components/SentryTracer"
import SplashScreen from "@src/components/SplashScreen"
import { config } from "@src/config/wagmi"
import queryClient from "@src/constants/queryClient"
import { WebAuthnProvider } from "@src/features/webauthn/providers/WebAuthnProvider"
import { initSDK } from "@src/libs/defuse-sdk/initSDK"
import ActivityDockProvider from "@src/providers/ActivityDockProvider"
import { AuthCookieSync } from "@src/providers/AuthCookieSync"
import { MixpanelProvider } from "@src/providers/MixpanelProvider"
import { NearWalletProvider } from "@src/providers/NearWalletProvider"
import { SolanaWalletProvider } from "@src/providers/SolanaWalletProvider"
import { StellarWalletProvider } from "@src/providers/StellarWalletProvider"
import { SwapTrackerMachineProvider } from "@src/providers/SwapTrackerMachineProvider"
import { SystemStatusProvider } from "@src/providers/SystemStatusProvider"
import { ThemeProvider } from "@src/providers/ThemeProvider"
import { TonConnectUIProvider } from "@src/providers/TonConnectUIProvider"
import { TronWalletProvider } from "@src/providers/TronWalletProvider"
import { WalletVerificationProvider } from "@src/providers/WalletVerificationProvider"
import { WithdrawTrackerMachineProvider } from "@src/providers/WithdrawTrackerMachineProvider"
import { APP_ENV } from "@src/utils/environment"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { ReactNode } from "react"
import { WagmiProvider } from "wagmi"

const AppRootLayout = async ({
  children,
}: Readonly<{
  children?: ReactNode
}>) => {
  initSDK()
  const systemStatus = await getCachedSystemStatus()

  return (
    <>
      <InitDefuseSDK />

      <ThemeProvider>
        <SystemStatusProvider systemStatus={systemStatus}>
          <ActivityDockProvider>
            <SwapTrackerMachineProvider>
              <WithdrawTrackerMachineProvider>
                <WagmiProvider config={config}>
                  <QueryClientProvider client={queryClient}>
                    <NearWalletProvider>
                      <SolanaWalletProvider>
                        <StellarWalletProvider>
                          <TonConnectUIProvider>
                            <TronWalletProvider>
                              <WebAuthnProvider>
                                <MixpanelProvider>
                                  <PreloadFeatureFlags>
                                    <SplashScreen>{children}</SplashScreen>
                                  </PreloadFeatureFlags>
                                  <AuthCookieSync />
                                  <WalletVerificationProvider />
                                </MixpanelProvider>
                              </WebAuthnProvider>
                              <SentryTracer />
                            </TronWalletProvider>
                          </TonConnectUIProvider>
                        </StellarWalletProvider>
                      </SolanaWalletProvider>
                    </NearWalletProvider>
                    {APP_ENV === "development" && (
                      <ReactQueryDevtools initialIsOpen={false} />
                    )}
                  </QueryClientProvider>
                </WagmiProvider>
              </WithdrawTrackerMachineProvider>
            </SwapTrackerMachineProvider>
          </ActivityDockProvider>
        </SystemStatusProvider>
      </ThemeProvider>
    </>
  )
}

export default AppRootLayout
