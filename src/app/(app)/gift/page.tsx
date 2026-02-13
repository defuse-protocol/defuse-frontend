import { GiftTakerWidget } from "@src/components/DefuseSDK/features/gift/components/GiftTakerWidget"
import { SwapWidgetProvider } from "@src/components/DefuseSDK/providers/SwapWidgetProvider"

export default function ViewGiftPage() {
  return (
    <SwapWidgetProvider>
      <GiftTakerWidget />
    </SwapWidgetProvider>
  )
}
