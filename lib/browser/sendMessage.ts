/**
 * Send a message to another part of the extension
 */
export default function sendMessage<R>(operation: string, message: Record<string, unknown> = {}): Promise<R> {
	// Extend message with one custom property
	message._operation = operation;
	return browser.runtime.sendMessage(message);
}
