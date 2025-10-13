"use client"

import { TradeNavigationLinks } from "@src/components/DefuseSDK/components/TradeNavigationLinks"
import { SwapWidgetProvider } from "@src/components/DefuseSDK/providers/SwapWidgetProvider"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { useSelector } from "@xstate/react"
import { useCallback } from "react"
import { Island } from "../../../components/Island"
import {
  TokenListUpdater,
  TokenListUpdater1cs,
} from "../../../components/TokenListUpdater"
import { WidgetRoot } from "../../../components/WidgetRoot"
import type { SwapWidgetProps } from "../../../types/swap"
import { TokenMigration } from "../../tokenMigration/components/TokenMigration"
import { formValuesSelector } from "../actors/swapFormMachine"
import { SwapForm } from "./SwapForm"
import { SwapFormProvider } from "./SwapFormProvider"
import { SwapSubmitterProvider } from "./SwapSubmitter"
import { SwapUIMachineFormSyncProvider } from "./SwapUIMachineFormSyncProvider"
import {
  SwapUIMachineContext,
  SwapUIMachineProvider,
} from "./SwapUIMachineProvider"

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
  referral,
}: SwapWidgetProps) => {
  const is1cs = useIs1CsEnabled()
  return (
    <WidgetRoot>
      <SwapWidgetProvider>
        <Island className="widget-container flex flex-col gap-5">
          <TradeNavigationLinks
            currentRoute="swap"
            renderHostAppLink={renderHostAppLink}
          />
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
            >
              {is1cs ? (
                <TokenListUpdaterSwap tokenList={tokenList} />
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
        </Island>
      </SwapWidgetProvider>
    </WidgetRoot>
  )
}

function TokenListUpdaterSwap({ tokenList }: { tokenList: TokenInfo[] }) {
  const swapUIActorRef = SwapUIMachineContext.useActorRef()
  const formRef = useSelector(swapUIActorRef, (s) => s.context.formRef)
  const formValuesRef = useSelector(formRef, formValuesSelector)
  const formValues = useSelector(formValuesRef, (s) => s.context)

  const { tokenIn, tokenOut, depositedBalanceRef } = useSelector(
    swapUIActorRef,
    (snapshot) => ({
      tokenIn: formValues.tokenIn,
      tokenOut: formValues.tokenOut,
      depositedBalanceRef: snapshot.children.depositedBalanceRef,
    })
  )

  const sendTokenInOrOut = useCallback(
    (params: {
      tokenIn?: TokenInfo
      tokenOut?: TokenInfo
    }) => {
      swapUIActorRef.send({ type: "input", params })
    },
    [swapUIActorRef]
  )

  return (
    <TokenListUpdater1cs
      tokenList={tokenList}
      depositedBalanceRef={depositedBalanceRef}
      tokenIn={tokenIn}
      tokenOut={tokenOut}
      sendTokenInOrOut={sendTokenInOrOut}
    />
  )
}
