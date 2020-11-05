import type manifest from '../../manifest.json';

type Command = keyof typeof manifest.commands;

const listeners = new Map<string, () => void>();

/**
 * Add a command listener.
 * To unlisten: `onCommand('name')`
 *
 * Note: Currently this only accepts one listener per name. A subsequent
 * call just overrides the previous listener.
 */
export default function onCommand(command: Command, listener: () => void) {
	if (listeners.size === 0) {
		// First time this function is called
		browser.commands.onCommand.addListener(c => listeners.get(c)?.());
	}
	if (listener) {
		listeners.set(command, listener);
	} else {
		listeners.delete(command);
	}
}
