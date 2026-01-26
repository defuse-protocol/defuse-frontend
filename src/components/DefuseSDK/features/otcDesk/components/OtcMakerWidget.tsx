"use client"
import { useMemo } from "react"

import { Island } from "../../../components/Island"
import { TokenListUpdater } from "../../../components/TokenListUpdater"
import { IntentsLogo } from "../../../components/IntentsLogo"
import { WidgetRoot } from "../../../components/WidgetRoot"
import type { SignerCredentials } from "../../../core/formatters"
import { SwapWidgetProvider } from "../../../providers/SwapWidgetProvider"

import { OtcMakerForm, type OtcMakerWidgetProps } from "./OtcMakerForm"
import { OtcMakerTrades } from "./OtcMakerTrades"

export function OtcMakerWidget(props: OtcMakerWidgetProps) {
  const signerCredentials: SignerCredentials | null = useMemo(() => {
    return props.userAddress != null && props.chainType != null
      ? {
          credential: props.userAddress,
          credentialType: props.chainType,
        }
      : null
  }, [props.chainType, props.userAddress])

  return (
    <WidgetRoot>
      <SwapWidgetProvider>
        <Island className="widget-container flex flex-col gap-5">
          <IntentsLogo />
          <TokenListUpdater tokenList={props.tokenList} />
          <OtcMakerForm {...props} />

          {signerCredentials != null && (
            <OtcMakerTrades
              tokenList={props.tokenList}
              generateLink={props.generateLink}
              signerCredentials={signerCredentials}
              signMessage={props.signMessage}
              sendNearTransaction={props.sendNearTransaction}
            />
          )}
        </Island>
      </SwapWidgetProvider>
    </WidgetRoot>
  )
}
