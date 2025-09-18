"use client"
import { SwapWidgetProvider } from "@src/components/DefuseSDK/providers/SwapWidgetProvider"
import type { TokenWithTags } from "@src/constants/tokens"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { useSelector } from "@xstate/react"
import { useCallback } from "react"
import {
  TokenListUpdater,
  TokenListUpdater1cs,
} from "../../../components/TokenListUpdater"
import { WidgetRoot } from "../../../components/WidgetRoot"
import type { SwapWidgetProps } from "../../../types/swap"
import { TokenMigration } from "../../tokenMigration/components/TokenMigration"
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
  router,
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
            router={router}
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
      </SwapWidgetProvider>
    </WidgetRoot>
  )
}

function TokenListUpdaterSwap({ tokenList }: { tokenList: TokenWithTags[] }) {
  const swapUIActorRef = SwapUIMachineContext.useActorRef()
  const { tokenIn, tokenOut, depositedBalanceRef } = useSelector(
    swapUIActorRef,
    (snapshot) => ({
      tokenIn: snapshot.context.formValues.tokenIn,
      tokenOut: snapshot.context.formValues.tokenOut,
      depositedBalanceRef: snapshot.children.depositedBalanceRef,
    })
  )

  const sendTokenInOrOut = useCallback(
    (params: {
      tokenIn?: TokenWithTags
      tokenOut?: TokenWithTags
    }) => {
      swapUIActorRef.send({
        type: "input",
        params: params,
      })
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
