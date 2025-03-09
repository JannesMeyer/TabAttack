export type Message = Record<string, unknown> & { sendMessageOperationName?: string };

/**
 * Send a message to another part of the extension
 */
export default function sendMessage<R>(operation: string, message: Message = {}): Promise<R> {
	// Extend message with one custom property
	message.sendMessageOperationName = operation;
	return chrome.runtime.sendMessage(message);
}
