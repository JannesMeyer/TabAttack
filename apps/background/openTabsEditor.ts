import UrlQuery from '../../lib/dom/UrlQuery.js';

/** Open the tab editor in a new tab */
export default async function openTabsEditor(p: { tab?: number, window?: number, import?: boolean } = {}) {
	let url = browser.runtime.getURL('export.html') + new UrlQuery(p);
	let tab = await browser.tabs.create({ url, openerTabId: p.tab });
	if (tab.windowId != null) {
		await browser.windows.update(tab.windowId, { focused: true });
	}
	return tab;
}
