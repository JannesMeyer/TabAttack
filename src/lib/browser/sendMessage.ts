/**
 * Send a message to another part of the extension
 */
export function sendMessage<R>(operation: string, message: any = {}): Promise<R> {
  // Extend message with one custom property
  message._operation = operation;

  // TODO: check browser.runtime.lastError and response.error
  return browser.runtime.sendMessage(message);
}