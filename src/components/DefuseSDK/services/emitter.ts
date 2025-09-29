import type { EventEmitter } from "node:events"
import { logger } from "@src/utils/logger"

// internal reference; starts out undefined
let bus: EventEmitter

export const setEventEmitter = (emitter: EventEmitter) => {
  bus = emitter
}

type EmitTypes =
  | "gift_created"
  | "deposit_initiated"
  | "deposit_success"
  | "gift_claimed"
  | "otc_deal_initiated"
  | "swap_initiated"
  | "swap_confirmed"
  | "otc_confirmed"
  | "withdrawal_initiated"
  | "withdrawal_confirmed"

export const emitEvent = (type: EmitTypes, data: unknown) => {
  if (!bus) {
    logger.error("EventEmitter not set!")
    return
  }
  bus.emit(type, data)
}
