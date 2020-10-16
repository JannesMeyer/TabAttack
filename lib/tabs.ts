import isDefined from './isDefined.js';

/**
 * Create new window
 */
export function moveToNewWindow(tabs: browser.tabs.Tab[], incognito: boolean) {
	let tabIds = tabs.map(tab => tab.id).filter(isDefined);
	let activeTab = tabs.find(tab => tab.active);

	setTimeout(() => {
		// Use the first tab, so that we don't get a NTP
		browser.windows.create({ tabId: tabIds.shift(), focused: true, incognito }).then(wnd => {
			if (tabIds.length > 0 && activeTab && activeTab.id != null) {
				let activeTabId = activeTab.id;
				browser.tabs.move(tabIds, { windowId: wnd.id, index: -1 }).then(() => {
					browser.tabs.update(activeTabId, { active: true });
				});
			}
		});
	}, 0);
}

/**
 * Move tabs to a target window
 */
export function moveToWindow(tabs: browser.tabs.Tab[], targetWindowId: number) {
	// The tabs can include the active tab
	let activeTab = tabs.find(tab => tab.active);

	// Focus the target window
	browser.windows.update(targetWindowId, { focused: true });

	// Move the tabs
	let tabIds = tabs.map(tab => tab.id).filter(isDefined);
	browser.tabs.move(tabIds, { windowId: targetWindowId, index: -1 }).then(() => {
		if (activeTab == null || activeTab.id == null) {
			return;
		}
		browser.tabs.update(activeTab.id, { active: true });    
	});
}