import { openTabsEditor } from './common/helpers/openTabsEditor';
import { assertNever } from './common/util/assertNever';
import { syncPrefs } from './prefs';
import { BrowserAction } from './types';

syncPrefs.watch('action', value => {
	if (value === BrowserAction.Dropdown) {
		chrome.action.setPopup({ popup: getPopupUrl(BrowserAction.Dropdown) });
	} else {
		chrome.action.setPopup({ popup: '' });
	}
});

chrome.action.onClicked.addListener((tab) => {
	const action = syncPrefs.get('action');
	if (action === BrowserAction.Dropdown) {
		return; // See setPopup above
	}
	// if (info?.button === 1 || info?.modifiers.includes('Shift')) {
	// 	return;
	// }
	if (action === BrowserAction.Sidebar) {
		browser.sidebarAction.toggle();
		return;
	}
	if (action === BrowserAction.Tab) {
		openTab(tab);
		return;
	}
	if (action === BrowserAction.ExportTabs) {
		openTabsEditor({ tab: tab.id, window: tab.windowId });
		return;
	}
	assertNever(action);
});

function openTab(opener: chrome.tabs.Tab) {
	const url = getPopupUrl(BrowserAction.Tab);
	if (!opener.url?.startsWith(url)) {
		chrome.tabs.create({ openerTabId: opener.id, url });
	} else if (opener.id != null) {
		chrome.tabs.remove(opener.id);
	}
}

function getPopupUrl(type: BrowserAction) {
	return chrome.runtime.getURL('popup.html') + '?' + new URLSearchParams({ t: type });
}
