type Callback = (message: Record<string, unknown>, sender: browser.runtime.MessageSender) => (Promise<unknown> | void);

const listeners = new Map<string, Callback>();

/** Collective listener */
const globalHandler: Callback = (message, sender) => {
	let { _operation } = message;
	if (typeof _operation !== 'string') {
		throw new Error('Invalid operation');
	}
	listeners.get(_operation)?.(message, sender);
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