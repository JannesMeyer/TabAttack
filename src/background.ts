import { subscribe } from 'valtio';
import Icon from './background/Icon';
import { setupNativeMessaging } from './background/native-messaging';
import { TabStore } from './lib/TabStore';
import { Theme } from './lib/Theme';

import './background/commands';

// Firefox only: per-window icon and native messaging
if (typeof browser !== 'undefined') {
	const store = new TabStore();
	const theme = new Theme();
	const icon = new Icon(devicePixelRatio * 2, theme);
	const nativeMessaging = setupNativeMessaging();

	subscribe(store.state, () => {
		render();
		nativeMessaging?.sendTabs();
	});
	theme.listeners.add(render);

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

