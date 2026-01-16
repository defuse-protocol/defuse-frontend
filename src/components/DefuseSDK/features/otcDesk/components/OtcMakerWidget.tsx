"use client"

import { TokenListUpdater } from "../../../components/TokenListUpdater"
import { SwapWidgetProvider } from "../../../providers/SwapWidgetProvider"
import { OtcMakerForm, type OtcMakerWidgetProps } from "./OtcMakerForm"

export function OtcMakerWidget(props: OtcMakerWidgetProps) {
  return (
    <SwapWidgetProvider>
      <TokenListUpdater tokenList={props.tokenList} />
      <OtcMakerForm {...props} />
    </SwapWidgetProvider>
  )
}
