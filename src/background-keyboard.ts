import onCommand from './lib/browser/onCommand';
import isDefined from './lib/isDefined';
import { throwError } from './lib/throwError';

/** Global shortcut: Move highlighted tabs left */
onCommand('move_tab_left', () => moveHighlighted(-1));

/** Global shortcut: Move highlighted tabs right */
onCommand('move_tab_right', () => moveHighlighted(1));

// Global shortcut: Pin highlighted tabs
onCommand('pin_tab', () =>
	getHighlighted().then(tabs => {
		for (let tab of tabs) {
			if (tab.id != null) {
				chrome.tabs.update(tab.id, { pinned: !tab.pinned });
			}
		}
	}));

// Global shortcut: Duplicate highlighted tabs
onCommand('duplicate_tab', () =>
	getHighlighted().then(tabs =>
		Promise.all(
			tabs
				.map(t => t.id)
				.filter(isDefined)
				.map(id => chrome.tabs.duplicate(id)),
		)
	));

/**
 * Gets all highlighted tabs in the last focused window.
 * This function is guaranteed to at least return the active
 * tab of that window.
 */
function getHighlighted() {
	// Opera doesn't have highlighted tabs, so we have to customize the query
	const isOpera = navigator.vendor.indexOf('Opera') !== -1;
	if (isOpera) {
		return chrome.tabs.query({ lastFocusedWindow: true, active: true });
	}
	return chrome.tabs.query({ lastFocusedWindow: true, highlighted: true });
}

/**
 * Move all highlighted tabs in a window to the left or to the right
 */
function moveHighlighted(direction: number) {
	if (direction === 0) {
		throw new TypeError("The direction parameter can't be zero");
	}
	chrome.windows.getLastFocused({ populate: true }).then(w => {
		if (w.tabs == null) {
			throw new Error('The window does not have tabs');
		}
		// Opera reports all tabs as not highlighted, even the active one
		let highlighted = w.tabs.filter(t => t.highlighted || t.active);

		// Change the iteration behaviour to backwards
		if (direction > 0) {
			highlighted[Symbol.iterator] = valuesReversed as any;
		}

		// Iterate through all highlighted tabs
		for (let tab of highlighted) {
			let index = tab.index;
			do {
				index = (w.tabs.length + index + direction) % w.tabs.length;
			} while (tab.pinned !== (w.tabs[index] ?? throwError()).pinned);
			if (tab.id != null) {
				chrome.tabs.move(tab.id, { index });
			}
		}
	});
}

/**
 * Iterates backwards over an array.
 * Does not handle sparse arrays in a special way, just like
 * the original iterator.
 */
function* valuesReversed<X>(this: readonly X[]) {
	for (let i = this.length - 1; i >= 0; --i) {
		yield this[i] as X;
	}
}
