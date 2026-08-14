import React from 'react';

type KeyboardKey =
	| ' '
	| 'Enter'
	| 'ArrowUp'
	| 'ArrowDown'
	| 'Escape'
	| (string & {});

export function useGlobalShortcut(callback: (key: KeyboardKey, event: KeyboardEvent) => boolean | undefined) {
	const callbackRef = React.useRef(callback);
	callbackRef.current = callback;
	React.useEffect(() => {
		addEventListener('keydown', listener);
		return () => removeEventListener('keydown', listener);

		function listener(ev: KeyboardEvent) {
			if (ev.defaultPrevented) {
				return;
			}
			const success = callbackRef.current?.(ev.key, ev);
			if (success) {
				ev.preventDefault();
			}
		}
	}, []);
}
