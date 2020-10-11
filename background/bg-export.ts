import onCommand from '../lib/browser/onCommand.js';
import ContextMenuItem from '../lib/ContextMenuItem.js';
import logError from '../lib/logError.js';
import getActiveTab from '../lib/browser/getActiveTab.js';
import UrlQuery from '../lib/dom/UrlQuery.js';

// All windows
browser.browserAction.onClicked.addListener(tab => openTabsEditor(tab));

// Only current window
new ContextMenuItem({
	id: 'export_current_window',
	contexts: ['browser_action'],
	onclick: (_, tab) => openTabsEditor(tab, true),
});
onCommand('export_current_window', () => getActiveTab().then(tab => openTabsEditor(tab, true)));

/** Open the tab editor in a new tab */
function openTabsEditor({ id, windowId }: browser.tabs.Tab, single?: true) {
	let url = browser.runtime.getURL('tabs.html') + new UrlQuery({ t: id, w: windowId, single });
	return browser.tabs.create({ url, openerTabId: id }).catch(logError);
}
