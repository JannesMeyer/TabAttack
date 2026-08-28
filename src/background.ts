import { subscribe } from 'valtio/vanilla';
import Icon from './background/Icon';
import { TabStore } from './lib/TabStore';
import { Theme } from './lib/Theme';

import './background/commands';
import { prefersDark } from './lib/resolveLightDark';

// Firefox/Safari: per-window icon
if (typeof devicePixelRatio !== 'undefined') {
	const store = new TabStore();
	const theme = new Theme();
	const icon = new Icon(devicePixelRatio * 2, theme);

	subscribe(store.state, render);
	subscribe(theme.colors, render);
	prefersDark?.addEventListener('change', render);

	function render() {
		for (const [id, { type }] of store.state.windows.entries()) {
			if (type !== 'normal') continue;
			const tabs = store.state.tabOrder.get(id) ?? [];
			const activeTabId = store.state.activeTabs.get(id);
			const index = tabs.findIndex(id => id === activeTabId);
			const data = icon.render(tabs.length, index < 0 ? tabs.length : index);
			browser.action.setIcon({ windowId: id, imageData: { [data.width]: data } });
		}
	}
}
