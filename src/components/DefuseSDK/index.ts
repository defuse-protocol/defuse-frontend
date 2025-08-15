export { AccountWidget } from "./features/account/components/AccountWidget"
export { DepositWidget } from "./features/deposit/components/DepositWidget"
export { SwapWidget } from "./features/swap/components/SwapWidget"
export { WithdrawWidget } from "./features/withdraw/components/WithdrawWidget"
export { OtcMakerWidget } from "./features/otcDesk/components/OtcMakerWidget"
export { OtcTakerWidget } from "./features/otcDesk/components/OtcTakerWidget"
export { GiftMakerWidget } from "./features/gift/components/GiftMakerWidget"
export { GiftTakerWidget } from "./features/gift/components/GiftTakerWidget"
export { GiftHistoryWidget } from "./features/gift/components/GiftHistoryWidget"

// Message creation utilities
export {
  createEmptyIntentMessage,
  createSwapIntentMessage,
} from "./core/messages"
export type { IntentMessageConfig } from "./core/messages"

// Protocol formatters
export {
  formatSignedIntent,
  formatUserIdentity,
  type IntentsUserId,
  type SignerCredentials,
} from "./core/formatters"

// Validation utilities
export { MultiPayloadDeepSchema } from "./features/otcDesk/utils/schemaMultipayload"
