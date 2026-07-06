import { EventEmitter } from 'events';

declare global {
  var globalLogEmitter: EventEmitter | undefined;
}

export const logEventEmitter = globalThis.globalLogEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalThis.globalLogEmitter = logEventEmitter;
}
