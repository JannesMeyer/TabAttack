var listeners = new Map();

/**
 * Send a message to another part of the extension
 */
export function sendMessage(operation: string, message: any = {}) {
  // Extend message with one custom property
  message._chrome_operation = operation;

  return new Promise((resolve, reject) => {
    // Send message and look at response.error
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (response && response.error) {
        reject(response);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Collective listener
 */
function globalHandler(message: any, sender: chrome.runtime.MessageSender, sendResponse: Function) {
  var listener = listeners.get(message._chrome_operation);
  if (listener) {
    listener(message, sender, sendResponse);
  }
}

/**
 * Add a message listener. Only accepts one listener for each operation value.
 * To un-listen, just do this:
 *   onMessage('operation name', null)
 */
export function onMessage(operation: string, handler: Function) {
  if (listeners.size === 0) {
    chrome.runtime.onMessage.addListener(globalHandler);
  }
  listeners.set(operation, handler);
}