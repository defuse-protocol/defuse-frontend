import type { EventEmitter } from "node:events"

declare global {
  var __bus__: EventEmitter | undefined
}
