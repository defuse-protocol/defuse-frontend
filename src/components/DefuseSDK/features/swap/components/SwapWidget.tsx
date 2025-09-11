"use client"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import {
  TokenListUpdater,
  TokenListUpdater1cs,
} from "../../../components/TokenListUpdater"
import { WidgetRoot } from "../../../components/WidgetRoot"
import { SwapWidgetProvider } from "../../../providers/SwapWidgetProvider"
import type { SwapWidgetProps } from "../../../types/swap"
import { TokenMigration } from "../../tokenMigration/components/TokenMigration"

import { SwapForm } from "./SwapForm"
import { SwapFormProvider } from "./SwapFormProvider"
import { SwapSubmitterProvider } from "./SwapSubmitter"
import { SwapUIMachineFormSyncProvider } from "./SwapUIMachineFormSyncProvider"
import { SwapUIMachineProvider } from "./SwapUIMachineProvider"

export const SwapWidget = ({
  tokenList,
  userAddress,
  userChainType,
  sendNearTransaction,
  signMessage,
  onSuccessSwap,
  renderHostAppLink,
  initialTokenIn,
  initialTokenOut,
  onTokenChange,
  referral,
}: SwapWidgetProps) => {
  const is1cs = useIs1CsEnabled()
  return (
    <WidgetRoot>
      <SwapWidgetProvider>
        <TokenMigration
          userAddress={userAddress}
          userChainType={userChainType}
          signMessage={signMessage}
        />

        <SwapFormProvider>
          <SwapUIMachineProvider
            initialTokenIn={initialTokenIn}
            initialTokenOut={initialTokenOut}
            tokenList={tokenList}
            signMessage={signMessage}
            referral={referral}
            onTokenChange={onTokenChange}
          >
            {is1cs ? (
              <TokenListUpdater1cs tokenList={tokenList} />
            ) : (
              <TokenListUpdater tokenList={tokenList} />
            )}

            <SwapUIMachineFormSyncProvider
              userAddress={userAddress}
              userChainType={userChainType}
              onSuccessSwap={onSuccessSwap}
              sendNearTransaction={sendNearTransaction}
            >
              <SwapSubmitterProvider
                userAddress={userAddress}
                userChainType={userChainType}
              >
                <SwapForm
                  isLoggedIn={userAddress != null}
                  renderHostAppLink={renderHostAppLink}
                />
              </SwapSubmitterProvider>
            </SwapUIMachineFormSyncProvider>
          </SwapUIMachineProvider>
        </SwapFormProvider>
      </SwapWidgetProvider>
    </WidgetRoot>
  )
}
