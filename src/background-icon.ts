import { Theme } from './common/helpers/Theme';
import Icon from './lib/icon';
import { TabStore } from './popup/TabStore';
import { BrowserAction } from './types';

const store = new TabStore(BrowserAction.Background);
const theme = new Theme();
const icon = new Icon(devicePixelRatio * 2, theme);

store.windowListeners.add(render);
theme.listeners.add(render);

function render() {
	for (const { id, tabs, activeTabId } of store.windowList) {
		const index = tabs.findIndex(id => id === activeTabId);
		const data = icon.render(tabs.length, index < 0 ? tabs.length : index);
		browser.action.setIcon({ windowId: id, imageData: { [data.width]: data } });
	}
}

// Firefox only: Attention badge
browser.tabs.onUpdated.addListener((_, { attention, title }, tab) => {
	if (tab.windowId == null || tab.active || tab.status !== 'complete') {
		return;
	}
	if (attention === true || title != null) {
		increaseWindowAttention(tab.windowId);
	}
});

async function increaseWindowAttention(windowId: number) {
	const value = Number.parseInt(await browser.action.getBadgeText({ windowId })) || 0;
	await browser.action.setBadgeText({ windowId, text: (value + 1).toString() });
}
