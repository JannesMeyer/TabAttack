import { throwError } from '../lib/throwError';
import type { Command } from '../manifest';

chrome.commands.onCommand.addListener(c => commands[c as Command]());

const commands: Record<Command, () => unknown> = {
	pin_tab: async () => {
		for (const { id, pinned } of await chrome.tabs.query({ lastFocusedWindow: true, highlighted: true })) {
			if (id == null || id === chrome.tabs.TAB_ID_NONE) {
				continue;
			}
			chrome.tabs.update(id, { pinned: !pinned });
		}
	},
	duplicate_tab: async () => {
		for (const { id } of await chrome.tabs.query({ lastFocusedWindow: true, highlighted: true })) {
			if (id == null || id === chrome.tabs.TAB_ID_NONE) {
				continue;
			}
			chrome.tabs.duplicate(id);
		}
	},
	move_tab_left: () => moveHighlighted(-1),
	move_tab_right: () => moveHighlighted(+1),
};

/**
 * Move all highlighted tabs in a window to the left or to the right
 */
async function moveHighlighted(delta: number) {
	const { tabs } = await chrome.windows.getLastFocused({ populate: true });
	if (!tabs) {
		return;
	}
	const highlighted = tabs.filter(t => t.highlighted || t.active);
	if (delta > 0) {
		highlighted[Symbol.iterator] = valuesReversed;
	}
	for (const tab of highlighted) {
		if (tab.id == null || tab.id === chrome.tabs.TAB_ID_NONE) {
			continue;
		}
		let index = tab.index;
		do {
			index = (tabs.length + index + delta) % tabs.length;
		} while (tab.pinned !== (tabs[index] ?? throwError()).pinned);
		chrome.tabs.move(tab.id, { index });
	}
}

/** Iterate backwards over an array */
function* valuesReversed<X>(this: readonly X[]) {
	for (let i = this.length - 1; i >= 0; --i) {
		yield this[i] as X;
	}
	return undefined;
}
