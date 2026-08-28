let queue: (() => void) | undefined;

export function throttleRaf(callback: () => void) {
	if (!queue) {
		requestAnimationFrame(() => {
			const cb = queue;
			queue = undefined;
			cb?.();
		});
	}
	queue = callback;
}
