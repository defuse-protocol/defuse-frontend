import type { EventEmitter } from "node:events"

declare global {
  // eslint-disable-next-line no-var
  var __bus__: EventEmitter | undefined
}
