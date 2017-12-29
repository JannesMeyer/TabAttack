const listeners = new Map<string, () => void>();

/**
 * Add a command listener.
 * To unlisten: `onCommand('name', null)`
 *
 * Note: Currently this only accepts one listener per name. A subsequent
 * call just overrides the previous listener.
 */
export function onCommand(command: string, listener: () => void) {
  if (listeners.size === 0) {
    browser.commands.onCommand.addListener(globalListener);
  }
  listeners.set(command, listener);
}

function globalListener(command: string) {
  let listener = listeners.get(command);
  if (listener != null) {
    listener();
  }
}