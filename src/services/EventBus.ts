import { EventEmitter } from "events"

const bus: EventEmitter = global.__bus__ ? global.__bus__ : new EventEmitter()
global.__bus__ = bus

export default global.__bus__
