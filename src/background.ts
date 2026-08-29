import { subscribe } from 'valtio/vanilla';
import Icon from './background/Icon';
import { TabStore } from './lib/TabStore';
import { Theme } from './lib/Theme';

import { syncPrefs } from './prefs';

import './background/commands';
import { prefersDark } from './lib/resolveLightDark';

// Firefox/Safari: per-window icon
if (typeof devicePixelRatio !== 'undefined') {
	const store = new TabStore();
	const theme = new Theme();
	const sizes = [16, 19, 32, 38];
	const icons = sizes.map(size => ({ size, icon: new Icon(size, theme) }));

	let unsubscribeStore: (() => void) | null = null;

	function updateSubscription() {
		const isDynamic = syncPrefs.values.dynamicIcon;
		if (isDynamic && !unsubscribeStore) {
			unsubscribeStore = subscribe(store.state, render);
		} else if (!isDynamic && unsubscribeStore) {
			unsubscribeStore();
			unsubscribeStore = null;
		}
		render();
	}

	subscribe(theme.colors, render);
	prefersDark?.addEventListener('change', render);
	subscribe(syncPrefs.values, updateSubscription);
	updateSubscription();

	function render() {
		const isDynamic = syncPrefs.values.dynamicIcon;

		for (const [id, { type }] of store.state.windows.entries()) {
			if (type !== 'normal') continue;
			const tabs = isDynamic ? (store.state.tabOrder.get(id) ?? []) : [];
			const count = isDynamic ? tabs.length : 3; // 3 bars for static brand icon

			const imageData: Record<number, ImageData> = {};
			for (const { size, icon } of icons) {
				imageData[size] = icon.render(count);
			}
			browser.action.setIcon({ windowId: id, imageData });
		}
	}
}
