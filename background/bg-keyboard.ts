import onCommand from '../lib/browser/onCommand.js';
import isDefined from '../lib/isDefined.js';
import logError from '../lib/logError.js';
import assertDefined from '../lib/assertDefined.js';

/** Global shortcut: Move highlighted tabs left */
onCommand('move_tab_left', () => moveHighlighted(-1));

/** Global shortcut: Move highlighted tabs right */
onCommand('move_tab_right', () => moveHighlighted(1));

// Global shortcut: Pin highlighted tabs
onCommand('pin_tab', function() {
	getHighlighted().then(tabs => {
		for (let tab of tabs) {
			if (tab.id != null) {
				browser.tabs.update(tab.id, { pinned: !tab.pinned });
			}
		}
	});
});

// Global shortcut: Duplicate highlighted tabs
onCommand('duplicate_tab', function() {
	getHighlighted()
		.then(tabs => Promise.all(tabs.map(t => t.id).filter(isDefined).map(id => browser.tabs.duplicate(id))))
		.catch(logError);
});

/**
 * Gets all highlighted tabs in the last focused window.
 * This function is guaranteed to at least return the active
 * tab of that window.
 */
function getHighlighted() {
	// Opera doesn't have highlighted tabs, so we have to customize the query
	const isOpera = (navigator.vendor.indexOf('Opera') !== -1);
	if (isOpera) {
		return browser.tabs.query({ lastFocusedWindow: true, active: true });
	} else {
		return browser.tabs.query({ lastFocusedWindow: true, highlighted: true });
	}
}

/**
 * Move all highlighted tabs in a window to the left or to the right
 */
function moveHighlighted(direction: number) {
	if (direction === 0) {
		throw new TypeError('The direction parameter can\'t be zero');
	}
	browser.windows.getLastFocused({ populate: true }).then(w => {
		if (w.tabs == null) {
			throw new Error('The window does not have tabs');
		}
		// Opera reports all tabs as not highlighted, even the active one
		let highlighted = w.tabs.filter(t => t.highlighted || t.active);

		// Change the iteration behaviour to backwards
		if (direction > 0) {
			highlighted[Symbol.iterator] = valuesReversed;
		}

		// Iterate through all highlighted tabs
		for (let tab of highlighted) {
			let index = tab.index;
			do {
				index = (w.tabs.length + index + direction) % w.tabs.length;
			} while (tab.pinned !== assertDefined(w.tabs[index]).pinned);
			if (tab.id != null) {
				browser.tabs.move(tab.id, { index });
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
	for (let i = this.length - 1; 0 <= i; --i) {
		yield this[i] as X;
	}
}