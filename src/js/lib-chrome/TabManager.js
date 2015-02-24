// Feature detection doesn't work, because Opera pretends to support all chrome.tab APIs
var isOpera = (navigator.vendor.indexOf('Opera') !== -1);

/**
 * Gets all highlighted tabs in the last focused window.
 * This function is guaranteed to at least return the active
 * tab of that window.
 */
export function getHighlightedTabs() {
	// TODO: file a bug report about this
	// Opera doesn't have highlighted tabs, so we have to customize the query
	if (isOpera) {
		return Chrome.queryTabs({ lastFocusedWindow: true, active: true });
	} else {
		return Chrome.queryTabs({ lastFocusedWindow: true, highlighted: true });
	}
}

/**
 * Gets active tab in the last focused window.
 */
export function getActiveTab() {
	return Chrome.queryTabs({ lastFocusedWindow: true, active: true }).then(results => results[0]);
}

/**
 * Show a URL by either opening it in a new tab or by
 * navigating to it in another tab if it contains the NTP.
 */
export function show(openerTab, url) {
	if (openerTab.url === 'chrome://newtab/' && !openerTab.incognito) {
		return Promise.all([ Chrome.createTab({ url }), Chrome.removeTabs(openerTab.id) ]);
	} else {
		return Chrome.createTab({ url, openerTabId: openerTab.id });
	}
}

/**
 * Opens all windows/tabs that are passed into this function.
 * Re-uses the current window for the first window and just opens
 * new tabs in it if it only has one tab.
 *
 * @param windows: 2-dimensional array of windows and URLs
 */
export function restoreWindows(windows) {
	Chrome.getLastFocusedWindow({ populate: true }).then(wnd => {
		// New tabs to create in the CURRENT window
		var newTabs = (wnd.tabs.length === 1) ? windows.shift() : [];

		// Open new windows
		for (var urls of windows) {
			Chrome.createWindow({ url: urls, focused: false });
		}

		// Restore focus
		if (newTabs.length > 0) {
			Chrome.updateWindow(wnd.id, { focused: true });
		}

		// Re-use current window
		for (var url of newTabs) {
			Chrome.createTab({ windowId: wnd.id, url, active: false });
		}
	});
}


/**
 * Return the number of tabs that are open
 */
export function getTabCount() {
	return Chrome.queryTabs({ windowType: 'normal' }).then(tabs => tabs.length);
}

/**
 * Close all other tabs except the specified one
 */
export function closeOtherTabs(sourceTab) {
	return Chrome.getAllWindows({ populate: true }).then(windows => {
		var sourceWindow, promises = [];

		// Close other windows
		for (var wnd of windows) {
			if (wnd.id === sourceTab.windowId) {
				sourceWindow = wnd;
			} else {
				promises.push(Chrome.removeWindow(wnd.id));
			}
		}

		// Close other tabs
		var tabIds = sourceWindow.tabs.map(tab => tab.id).filter(id => id !== sourceTab.id);
		promises.push(Chrome.removeTabs(tabIds));

		// Resolve when everything is done
		return Promise.all(promises);
	});
}

/**
 * Move tabs from a source to a target window.
 * If targetWindowId is undefined, create new window.
 */
export function moveTabsToWindow(tabs, targetWindowId, incognito) {
	var tabIds = tabs.map(tab => tab.id);
	var activeTab = tabs.find(tab => tab.active);

	if (targetWindowId === undefined) {
		// Create a new window
		setTimeout(() => {
			// Use the first tab, so that we don't get a NTP
			Chrome.createWindow({ tabId: tabIds.shift(), focused: true, incognito }).then(wnd => {
				if (tabIds.length > 0) {
					Chrome.moveTabs(tabIds, { windowId: wnd.id, index: -1 }).then(() => {
						Chrome.updateTab(activeTab.id, { active: true });
					});
				}
			});
		}, 0);
	} else {
		// Use existing window
		Chrome.updateWindow(targetWindowId, { focused: true });
		Chrome.moveTabs(tabIds, { windowId: targetWindowId, index: -1 }).then(() => {
			Chrome.updateTab(activeTab.id, { active: true });
		});
	}
}

/**
 * Move all highlighted tabs in a window to the left or to the right
 */
export function moveTabs(direction) {
	Chrome.getLastFocusedWindow({ populate: true }).then(wnd => {
		var numTabs = wnd.tabs.length;
		for (var tab of (direction > 0) ? backwards(wnd.tabs) : wnd.tabs) {
			// Opera doesn't have highlighted tabs, so we also check for .active
			if (!tab.highlighted && !tab.active) {
				continue;
			}

			var newIndex = tab.index;
			do {
				// Moving pinned tabs into non-pinned tabs (and vice-versa) is impossible,
				// so we have to skip those indexes
				newIndex = (newIndex + direction + numTabs) % numTabs;
			} while (tab.pinned !== wnd.tabs[newIndex].pinned);

			Chrome.moveTabs(tab.id, { index: newIndex });
		}
	});
}

/**
 * Generator: Iterate backwards over an array
 */
function* backwards(arr) {
  for (var i = arr.length - 1; i >= 0; --i) {
    yield arr[i];
  }
}