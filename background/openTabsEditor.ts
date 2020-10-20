import UrlQuery from '../lib/dom/UrlQuery.js';

/** Open the tab editor in a new tab */
export default function openTabsEditor(p: { tab?: number, window?: number, import?: boolean } = {}) {
	let url = browser.runtime.getURL('tabs.html') + new UrlQuery(p);
	return browser.tabs.create({ url, openerTabId: p.tab });
}
