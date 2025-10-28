"use client"
import { Island } from "@src/components/DefuseSDK/components/Island"
import { TokenListUpdater } from "../../../components/TokenListUpdater"
import { WidgetRoot } from "../../../components/WidgetRoot"
import { SwapWidgetProvider } from "../../../providers/SwapWidgetProvider"

import { GiftMakerForm } from "./GiftMakerForm"
import type { GiftMakerWidgetProps } from "./GiftMakerForm"

export function GiftMakerWidget(props: GiftMakerWidgetProps) {
  return (
    <WidgetRoot>
      <SwapWidgetProvider>
        <TokenListUpdater tokenList={props.tokenList} />
        <Island className="widget-container">
          <GiftMakerForm {...props} />
        </Island>
      </SwapWidgetProvider>
    </WidgetRoot>
  )
}
