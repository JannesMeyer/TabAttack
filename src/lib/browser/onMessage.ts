type Callback = (...args: any[]) => any;

const listeners = new Map<string, Callback>();

/** Collective listener */
const globalHandler: Callback = (message: any, sender, sendResponse) => {
  listeners.get(message._operation)?.(message, sender, sendResponse);
};

/**
 * Add a message listener. Only accepts one listener for each operation.
 * To unlisten, just leave the handler blank
 */
export default function onMessage(operation: string, handler?: Callback) {
  if (listeners.size === 0) {
    browser.runtime.onMessage.addListener(globalHandler);
  }
  if (handler) {
    listeners.set(operation, handler);
  } else {
    listeners.delete(operation);
  }
}