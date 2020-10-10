import onCommand from '../lib/browser/onCommand.js';
import ContextMenuItem from '../lib/ContextMenuItem.js';
import logError from '../lib/logError.js';
import getActiveTab from '../lib/browser/getActiveTab.js';
import assertDefined from '../lib/assertDefined.js';

// All windows
browser.browserAction.onClicked.addListener(tab => openTabsEditor(tab).catch(logError));

// Only current window
new ContextMenuItem({
	id: 'export_current_window',
	contexts: ['browser_action'],
	onclick: (_, tab) => openTabsEditor(tab, true).catch(logError),
});
onCommand('export_current_window', () => getActiveTab().then(tab => openTabsEditor(tab, true)).catch(logError));

/** Open the tab editor in a new tab */
function openTabsEditor(sourceTab: browser.tabs.Tab, onlyCurrentWindow = false) {
	let url = browser.runtime.getURL('tabs.html');
	if (onlyCurrentWindow) {
		url += '?w=' + assertDefined(sourceTab.windowId);
	}
	return browser.tabs.create({ url, openerTabId: sourceTab.id });
}