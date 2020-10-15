import logError from '../lib/logError.js';
import UrlQuery from '../lib/dom/UrlQuery.js';

/** Open the tab editor in a new tab */
export default function openTabsEditor({ id, windowId }: Pick<browser.tabs.Tab, 'id' | 'windowId'> = {}, single?: true) {
	let url = browser.runtime.getURL('tabs.html') + new UrlQuery({ t: id, w: windowId, single });
	return browser.tabs.create({ url, openerTabId: id }).catch(logError);
}
